# Import required modules
import dotenv
import os
import sqlite3
import json
import base64
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import HTMLResponse
import jwt
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from cryptography.hazmat.primitives.serialization import load_der_public_key
from cryptography.exceptions import InvalidSignature

# Loading the environment variables
dotenv.load_dotenv()

# FIX 1: Safe JWT fallback
if not os.environ.get("SECRET_KEY"):
    os.environ["SECRET_KEY"] = "dev-secret-key-change-me"

# Initialize the api app
app = FastAPI()

# Define the allowed origins for CORS
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5177",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# SQLite Database Setup (Replaces MySQL)
# ============================================
DB_PATH = "voting.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize database
try:
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Voters table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS voters (
            voter_id TEXT PRIMARY KEY NOT NULL,
            role TEXT NOT NULL,
            password TEXT NOT NULL
        )
        """)
        
        # SSI Keys table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS voter_ssi_keys (
            voter_id TEXT PRIMARY KEY NOT NULL,
            ssi_public_jwk TEXT NOT NULL,
            FOREIGN KEY (voter_id) REFERENCES voters(voter_id)
        )
        """)
        
        # Offline Ballots table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS offline_ballots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            voter_id TEXT NOT NULL,
            ballot TEXT NOT NULL,
            signature TEXT NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Constituencies table (replacing MongoDB)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS constituencies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            constituency TEXT NOT NULL,
            state TEXT NOT NULL,
            candidates_json TEXT NOT NULL DEFAULT '[]',
            UNIQUE(constituency, state)
        )
        """)
        
        # Seed default users
        default_users = [
            ("admin-001", "admin", "adminpass"),
            ("user-001", "user", "userpass"),
        ]
        for v_id, role, pwd in default_users:
            cursor.execute("INSERT OR IGNORE INTO voters (voter_id, role, password) VALUES (?, ?, ?)", (v_id, role, pwd))

        # Seed default constituencies
        cursor.execute("SELECT count(*) FROM constituencies")
        count = cursor.fetchone()[0]
        if count == 0:
            seed_data = [
                ("Mumbai North", "Maharashtra", json.dumps([
                    {"name": "Candidate A", "party": "Indian National Congress"},
                    {"name": "Candidate B", "party": "Bharatiya Janata Party"}
                ])),
                ("Varanasi", "Uttar Pradesh", json.dumps([
                    {"name": "Candidate C", "party": "Bharatiya Janata Party"},
                    {"name": "Candidate D", "party": "Samajwadi Party"}
                ])),
                ("Chennai Central", "Tamil Nadu", json.dumps([
                    {"name": "Candidate E", "party": "Dravida Munnetra Kazhagam"},
                    {"name": "Candidate F", "party": "All India Anna Dravida Munnetra Kazhagam"}
                ]))
            ]
            cursor.executemany("INSERT INTO constituencies (constituency, state, candidates_json) VALUES (?, ?, ?)", seed_data)
        
        conn.commit()
        print("✅ SQLite Database initialized successfully")

except Exception as e:
    print(f"❌ Database initialization failed: {e}")


# ---- API MODELS ----
class LoginRequest(BaseModel):
    voter_id: str
    password: str

class SSIRegistration(BaseModel):
    voter_id: str
    ssi_public_jwk: Dict[str, Any]

class SignedBallot(BaseModel):
    ballot: Dict[str, Any]
    signature: str

class SubmitSignedBallotsRequest(BaseModel):
    voter_id: str
    ssi_public_jwk: Optional[Dict[str, Any]] = None
    ballots: list[SignedBallot]

class AddConstituencyRequest(BaseModel):
    constituency: str
    state: str
    candidates: list[dict] = []

class AddVoterRequest(BaseModel):
    voter_id: str
    role: str
    password: str

# ---- AUTH HELPERS ----
def get_current_user_from_request(request: Request) -> Optional[dict]:
    auth = request.headers.get('authorization')
    if not auth: return None
    try:
        token = auth.replace("Bearer ", "")
        return jwt.decode(token, os.environ["SECRET_KEY"], algorithms=['HS256'])
    except: return None

# ---- ENDPOINTS ----

@app.post("/login")
async def login(request: LoginRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT role FROM voters WHERE voter_id = ? AND password = ?", (request.voter_id, request.password))
        row = cursor.fetchone()
        
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = jwt.encode({'voter_id': request.voter_id, 'role': row['role']}, os.environ["SECRET_KEY"], algorithm='HS256')
    return {'token': token, 'role': row['role']}

@app.get("/validate-token")
async def validate_token(request: Request):
    payload = get_current_user_from_request(request)
    if not payload: raise HTTPException(status_code=401, detail="Invalid token")
    return payload

@app.post("/register-ssi")
async def register_ssi(reg: SSIRegistration):
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO voter_ssi_keys (voter_id, ssi_public_jwk) VALUES (?, ?)",
                (reg.voter_id, json.dumps(reg.ssi_public_jwk))
            )
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def jwk_to_public_key(jwk):
    if jwk.get("kty") != "EC" or jwk.get("crv") not in ("P-256", "secp256r1"):
        raise ValueError("Unsupported key type")
    
    def b64u_decode(val):
        return base64.urlsafe_b64decode(val + '=' * (-len(val) % 4))
        
    x = int.from_bytes(b64u_decode(jwk["x"]), "big")
    y = int.from_bytes(b64u_decode(jwk["y"]), "big")
    return ec.EllipticCurvePublicNumbers(x, y, ec.SECP256R1()).public_key()

def verify_signed_ballot(public_key, ballot, signature_b64):
    try:
        sig_bytes = base64.b64decode(signature_b64)
        data = json.dumps(ballot, sort_keys=True).encode("utf-8")
        public_key.verify(sig_bytes, data, ec.ECDSA(hashes.SHA256()))
        return True
    except: return False

@app.post("/submit-signed-ballots")
async def submit_signed_ballots(req: SubmitSignedBallotsRequest):
    jwk = req.ssi_public_jwk
    if not jwk:
        with get_db() as conn:
            row = conn.execute("SELECT ssi_public_jwk FROM voter_ssi_keys WHERE voter_id = ?", (req.voter_id,)).fetchone()
            if not row: raise HTTPException(status_code=400, detail="No SSI key found")
            jwk = json.loads(row['ssi_public_jwk'])
            
    try:
        pk = jwk_to_public_key(jwk)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid key: {e}")

    verified = 0
    with get_db() as conn:
        for sb in req.ballots:
            if verify_signed_ballot(pk, sb.ballot, sb.signature):
                conn.execute(
                    "INSERT INTO offline_ballots (voter_id, ballot, signature) VALUES (?, ?, ?)",
                    (req.voter_id, json.dumps(sb.ballot, sort_keys=True), sb.signature)
                )
                verified += 1
            else:
                raise HTTPException(status_code=400, detail="Invalid signature")
    
    return {"status": "ok", "stored": verified}

@app.get("/mongo-constituencies")
async def get_constituencies():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM constituencies").fetchall()
        return [
            {
                "constituency": r["constituency"],
                "state": r["state"],
                "candidates": json.loads(r["candidates_json"])
            } 
            for r in rows
        ]

@app.post("/add-constituency")
async def add_constituency(req: AddConstituencyRequest):
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO constituencies (constituency, state, candidates_json) VALUES (?, ?, ?)",
                (req.constituency, req.state, json.dumps(req.candidates))
            )
        return {"status": "ok", "message": "Constituency added"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Constituency already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-candidate-to-constituency")
async def add_candidate(constituency: str, state: str, candidate_name: str, party: str):
    with get_db() as conn:
        # Get current candidates
        row = conn.execute(
            "SELECT candidates_json FROM constituencies WHERE constituency = ? AND state = ?", 
            (constituency, state)
        ).fetchone()
        
        if not row: raise HTTPException(status_code=404, detail="Constituency not found")
        
        candidates = json.loads(row['candidates_json'])
        candidates.append({"name": candidate_name, "party": party})
        
        conn.execute(
            "UPDATE constituencies SET candidates_json = ? WHERE constituency = ? AND state = ?",
            (json.dumps(candidates), constituency, state)
        )
    return {"status": "ok", "message": "Candidate added"}

@app.post("/add-voter")
async def add_voter(req: AddVoterRequest):
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO voters (voter_id, role, password) VALUES (?, ?, ?)",
                (req.voter_id, req.role, req.password)
            )
        return {"status": "ok", "message": "Voter added"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Voter ID exists")

@app.get("/all-voters")
async def get_voters():
    with get_db() as conn:
        rows = conn.execute("SELECT voter_id, role FROM voters").fetchall()
        return [dict(r) for r in rows]

# ---- DB MANAGER UI ----
@app.get("/db-manager", response_class=HTMLResponse)
async def db_manager():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>DB Manager</title>
        <style>
            body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .card { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            input, select { margin: 5px 0; padding: 5px; width: 100%; box-sizing: border-box; }
            button { background: #007bff; color: white; padding: 8px 15px; border: none; cursor: pointer; }
            pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <h1>🗳️ Election Database Manager</h1>
        
        <div class="card">
            <h3>Add Constituency</h3>
            <input id="c_name" placeholder="Constituency Name">
            <input id="c_state" placeholder="State">
            <button onclick="addConst()">Add</button>
        </div>

        <div class="card">
            <h3>Add Candidate</h3>
            <input id="cand_c" placeholder="Constituency">
            <input id="cand_s" placeholder="State">
            <input id="cand_n" placeholder="Candidate Name">
            <input id="cand_p" placeholder="Party">
            <button onclick="addCand()">Add Candidate</button>
        </div>

        <div class="card">
            <h3>Add Voter</h3>
            <input id="v_id" placeholder="Voter ID">
            <select id="v_role"><option value="user">User</option><option value="admin">Admin</option></select>
            <input id="v_pass" placeholder="Password">
            <button onclick="addVoter()">Add Voter</button>
        </div>
        
        <div class="card">
            <h3>Data View</h3>
            <button onclick="loadData()">Refresh Data</button>
            <pre id="output">Loading...</pre>
        </div>

        <script>
            async function post(url, data) {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                const json = await res.json();
                alert(JSON.stringify(json, null, 2));
                loadData();
            }

            async function addConst() {
                await post('/add-constituency', {
                    constituency: document.getElementById('c_name').value,
                    state: document.getElementById('c_state').value
                });
            }

            async function addCand() {
                const c = document.getElementById('cand_c').value;
                const s = document.getElementById('cand_s').value;
                const n = document.getElementById('cand_n').value;
                const p = document.getElementById('cand_p').value;
                const url = `/add-candidate-to-constituency?constituency=${c}&state=${s}&candidate_name=${n}&party=${p}`;
                const res = await fetch(url, {method: 'POST'});
                alert(await res.text());
                loadData();
            }

            async function addVoter() {
                await post('/add-voter', {
                    voter_id: document.getElementById('v_id').value,
                    role: document.getElementById('v_role').value,
                    password: document.getElementById('v_pass').value
                });
            }

            async function loadData() {
                const v = await (await fetch('/all-voters')).json();
                const c = await (await fetch('/mongo-constituencies')).json();
                document.getElementById('output').textContent = 
                    "VOTERS:\n" + JSON.stringify(v, null, 2) + 
                    "\n\nCONSTITUENCIES:\n" + JSON.stringify(c, null, 2);
            }
            loadData();
        </script>
    </body>
    </html>
    """
