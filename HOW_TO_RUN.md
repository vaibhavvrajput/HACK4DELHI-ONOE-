# 🎉 How to Run Your Project

Your system is fully running! Here are the links to access everything:

## 1. 🖥️ Frontend (Voter & Admin Portal)
**URL:** [http://localhost:5173](http://localhost:5173)

- **Login Credentials:**
  - **Admin:** `admin-001` / `adminpass`
  - **User:** `user-001` / `userpass`

---

## 2. database Database Manager
**URL:** [http://localhost:8000/db-manager](http://localhost:8000/db-manager)

- Use this to:
  - Add new Voters
  - Add Constituencies
  - Add Candidates (which will show up on the voter page)

---

## 3. 🗳️ How to Run a Demo Election

1. **Login as Admin** (`admin-001`) at `http://localhost:5173`
   - Go to **Set Voting Dates** -> Select a range (Today to Tomorrow).
   - Click **Add Candidate** -> Enter Name & Party -> Click Add.
   - Go to **Self-Sovereign Identity** section -> Click **Generate Local SSI** -> Then **Register Key**.

2. **Login as Voter** (`user-001`) in Incognito window
   - You will see the candidates you added.
   - Click **Vote** on any candidate.
   - You'll see a success message!

---

## 🆘 Troubleshooting

If something isn't loading, paste this in your terminal to restart everything:

```bash
# 1. Kill old processes
pkill -f uvicorn
pkill -f "npm run dev"

# 2. Start Backend
cd Database_API && uvicorn main:app --reload --port 8000 &

# 3. Start Frontend
cd ../frontend && npm run dev &
```
