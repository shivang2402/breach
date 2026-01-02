# BREACH

Automated jailbreak finder. One AI tries to break another AI's safety rules while a third judges if it worked.

## Setup

**Prerequisites:**
- Python 3.9+
- Node.js 16+
- 3 Groq API keys (free at console.groq.com)

**Install:**
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

**Configure:**
```bash
cp .env.example .env
# Add your 3 Groq keys to .env
```

**Run:**
```bash
# Terminal 1 - Backend
cd backend
export GROQ_API_KEY_RED="your_key"
export GROQ_API_KEY_BLUE="your_key"
export GROQ_API_KEY_JUDGE="your_key"
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open `http://localhost:3000`

## How it works

- **Red Agent**: Generates attacks
- **Blue Agent**: Target system that tries to refuse
- **Judge Agent**: Scores success/fail

Loop runs continuously. When judge scores a successful jailbreak, it saves to artifacts and stops.

## Rate limits

Uses 3 separate API keys to avoid hitting Groq free tier limits (30 req/min per key). System sleeps between calls to stay under limits.

## Deploy

Push to GitHub, connect to Render.com, set environment variables. See `render.yaml` for config.

## Notes

Don't commit `.env` with real keys. Keys from same Groq account share daily quota (100k tokens), so create multiple accounts if needed for extended testing.
