# 🚀 Local Development Setup (No Ganache Required)

## ✅ What's Changed

Your system is now configured to run **completely locally** without blockchain:

1. ✅ **MongoDB is OPTIONAL** - disabled by default
2. ✅ **Ganache NOT required** - blockchain features can be added later
3. ✅ **MySQL-only mode** - all auth/data in local MySQL
4. ✅ **All 6 critical fixes applied**

---

## 🔧 Quick Start (3 Steps)

### Step 1: Start MySQL

```bash
# macOS - using Homebrew MySQL
brew services start mysql
# OR
mysql.server start

# Check if running
mysql -u root -e "SELECT 1"
```

### Step 2: Update MySQL Password (if needed)

```bash
nano Database_API/.env
# Change this line if your MySQL has a password:
# MYSQL_PASSWORD=your_actual_password
```

### Step 3: Start Backend

```bash
cd Database_API
uvicorn main:app --reload --port 8000
```

**Or use the startup script:**
```bash
./start-backend.sh
```

---

## 🎯 What Works NOW (Without Ganache)

✅ **Authentication System**
- Login/logout with JWT
- Admin and user roles
- Token validation

✅ **Database Features**
- Voter management (MySQL)
- Add/list voters via API
- Database manager UI at `http://127.0.0.1:8000/db-manager`

✅ **Frontend**
- React app on `http://localhost:5177`
- Login page with POST authentication
- Admin and voter dashboards
- SSI key generation (local browser storage)

---

## ❌ What's Disabled (Can Enable Later)

⚠️ **MongoDB Features** (optional)
- Constituency management
- To enable: Set `MONGO_ENABLED=true` in `.env` and install MongoDB

⚠️ **Blockchain Features** (optional)
- Add candidate via smart contract
- Cast vote on Ethereum
- To enable: See "Adding Blockchain Later" section below

---

## 🧪 Testing the Backend

### 1. Test Login Endpoint

```bash
# Login as admin
curl -X POST http://127.0.0.1:8000/login \
  -H "Content-Type: application/json" \
  -d '{"voter_id":"admin-001","password":"adminpass"}'

# Expected: {"token":"eyJ...","role":"admin"}
```

### 2. Test Database Manager

Open in browser: `http://127.0.0.1:8000/db-manager`

### 3. Test Frontend

```bash
cd frontend
npm run dev
# Open http://localhost:5177
```

Login with:
- **Admin**: `admin-001` / `adminpass`
- **User**: `user-001` / `userpass`

---

## 📁 Default Users (Auto-created)

The system automatically creates these users in MySQL:

| Voter ID | Password | Role |
|----------|----------|------|
| admin-001 | adminpass | admin |
| user-001 | userpass | user |

---

## 🔒 Current .env Configuration

```env
# MySQL Configuration (REQUIRED)
MYSQL_USER=root
MYSQL_PASSWORD=           # Empty = no password
MYSQL_HOST=127.0.0.1
MYSQL_DB=voter_db

# JWT Secret
SECRET_KEY=hack4delhi-voting-system-secret-2026

# MongoDB Configuration (DISABLED)
MONGO_ENABLED=false
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=election_db
```

---

## 🎨 Frontend Features (Available Now)

1. **Login Page** - JWT authentication with POST request
2. **Welcome Page** - ECI branding, chatbot, constituencies info
3. **Voter Dashboard** - View candidates, eligibility checks
4. **Admin Dashboard** - SSI management, offline ballot features
5. **Database Manager** - Web UI for CRUD operations

---

## 🔧 Troubleshooting

### MySQL Connection Error

**Problem**: `Can't connect to local MySQL server`

**Solution**:
```bash
# Start MySQL
brew services start mysql
# OR
mysql.server start

# Verify running
ps aux | grep mysql
```

### Empty Password Not Working

**Problem**: MySQL requires password but .env has empty

**Solution**:
```bash
# Option 1: Remove MySQL password
mysql -u root -p
mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY '';
mysql> FLUSH PRIVILEGES;

# Option 2: Update .env
nano Database_API/.env
# Set: MYSQL_PASSWORD=your_password
```

### Port 8000 Already in Use

**Problem**: Backend won't start

**Solution**:
```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn main:app --reload --port 8001
```

---

## 🚀 Adding Blockchain Later (Optional)

When you're ready to add Ethereum/Ganache:

### 1. Install Ganache
```bash
npm install -g ganache-cli
ganache-cli --port 7545
```

### 2. Deploy Contract
- Use Remix: https://remix.ethereum.org
- Paste `contracts/Voting.sol`
- Compile with Solidity 0.5.15
- Deploy using MetaMask (Injected Provider)
- Copy deployed address

### 3. Update Frontend
```javascript
// frontend/src/eth/votingConfig.js
export const VOTING_CONTRACT_ADDRESS = '0xYourDeployedAddress'
```

### 4. Configure MetaMask
- Add network: `http://127.0.0.1:7545`
- Chain ID: `1337` (or from Ganache)
- Import Ganache account private key

---

## 📊 System Architecture (Current)

```
┌─────────────────┐
│  React Frontend │  (Port 5177)
│   - Login UI    │
│   - Dashboards  │
└────────┬────────┘
         │ HTTP /api-auth
         ▼
┌─────────────────┐
│  FastAPI Server │  (Port 8000)
│   - JWT Auth    │
│   - REST API    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MySQL Database │
│   - voters      │
│   - ssi_keys    │
│   - ballots     │
└─────────────────┘
```

**MongoDB** and **Ethereum** are optional add-ons!

---

## 🎯 Demo-Ready Features (Working Now)

For Hack4Delhi presentation without blockchain:

1. ✅ **Secure Login** - JWT with role-based access
2. ✅ **Database Manager** - Live CRUD interface
3. ✅ **SSI Key Generation** - Self-sovereign identity (browser-based)
4. ✅ **Offline Ballot Signing** - Cryptographic signatures
5. ✅ **ECI Branding** - Professional UI with chatbot
6. ✅ **Automated Eligibility** - Smart date-based checks

All working **without** blockchain or MongoDB! 🎉

---

## 📞 Support

If backend starts successfully, you'll see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
✅ MongoDB disabled in configuration
✅ Default voters seeded
INFO:     Application startup complete
```

Ready to test! Open `http://localhost:5177` in your browser.
