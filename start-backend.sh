#!/bin/bash
cd "$(dirname "$0")/Database_API"
echo "🚀 Starting FastAPI Backend (SQLite Mode)"
echo "------------------------------------------------"
uvicorn main:app --reload --port 8000
