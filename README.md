# BREACH

Automated AI jailbreak discovery platform. One AI tries to break another AI's safety rules while a third judges if it worked.

**Live Demo:** [breach-frontend.onrender.com](https://breach-frontend.onrender.com) (deployment in progress)

## Tech Stack

**Backend:**
- Python 3.9+ (FastAPI, Uvicorn)
- WebSocket (real-time communication)
- Async/await patterns
- REST API design
- Environment-based configuration

**Frontend:**
- React 18 + TypeScript
- Vite (build tooling)
- TailwindCSS (styling)
- WebSocket client
- Real-time state management

**AI/LLM:**
- Groq API (Llama 3.3 70B)
- Multi-agent orchestration
- Prompt engineering
- Rate limiting & token optimization
- Adversarial testing patterns (PAIR, Prefix Injection)
- Memory & Context Awareness (Sliding Window History)

**Infrastructure:**
- Render.com (PaaS deployment)
- GitHub Actions ready
- Environment variable management
- CORS configuration
- Production-ready logging

## Architecture

```
┌─────────────┐      WebSocket       ┌──────────────┐
│   Frontend  │ ←──────────────────→ │   Backend    │
│  (React/TS) │      REST API        │  (FastAPI)   │
└─────────────┘                      └──────────────┘
                                            │
                                            ├─→ Red Agent (Attacker)
                                            ├─→ Blue Agent (Target)
                                            └─→ Judge Agent (Scorer)
                                                    │
                                                    ↓
                                            Groq API (LLM)
```

**Key Design Decisions:**
- **Multi-key strategy**: 3 separate API keys for independent rate limiting
- **Async orchestration**: Non-blocking agent coordination
- **Real-time updates**: WebSocket streaming for live feedback
- **Stateless design**: Artifacts stored in files for persistence
- **Rate limit handling**: Tiered cooldowns (60s warmup, 5s inter-agent, 30s loop)

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

**Run Locally:**
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

## How It Works

**Agents:**
- **Red Agent**: Generates adversarial prompts using context from previous attempts
- **Blue Agent**: Acts as target LLM with safety guardrails
- **Judge Agent**: Evaluates if jailbreak succeeded using structured JSON output

**Loop:**
1. Red generates attack based on history
2. Blue responds with defense
3. Judge scores success/fail
4. System saves successful jailbreaks
5. Loop continues until jailbreak found

**Rate Limiting Strategy:**
- 60s warmup per API key on initialization
- 5s pause between sequential agent calls
- 30s cooldown at end of each iteration
- Stays under Groq free tier (30 RPM, 6K TPM, 100K TPD)

## Advanced Tactics
**1. Aggressive Mode:**
- Targets sensitive topics (NSFW, Cyber, Weapons)
- Uses "No Refusal" directives and emotional pressure

**2. PAIR Strategy (2310.08419):**
- **Analyze**: Red Agent reviews previous refusal reasoning.
- **Improve**: Identifies specific triggers (e.g., "harmful", "illegal").
- **Refine**: Rewrites prompt to bypass triggers (e.g., masking intent, fictionalizing).

**3. Prefix Injection:**
- Forces the target to start response with affirmative text ("Sure, here is...").

## Deployment

**Render.com (Free Tier):**
```bash
# Push to GitHub
git push origin main

# On Render:
# 1. Import from GitHub
# 2. Render auto-detects render.yaml
# 3. Add environment variables
# 4. Deploy
```

**Environment Variables:**
- `GROQ_API_KEY_RED`
- `GROQ_API_KEY_BLUE`
- `GROQ_API_KEY_JUDGE`

**Production URLs:**
- Frontend: `https://breach-frontend.onrender.com`
- Backend API: `https://breach-backend.onrender.com`

## Project Structure

```
breach/
├── backend/
│   ├── app/
│   │   └── orchestrator.py    # Agent orchestration & rate limiting
│   ├── main.py                # FastAPI server & WebSocket
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── App.tsx            # React UI with real-time updates
│   └── package.json
├── prompts/
│   ├── red_agent.md           # Adversarial prompt template
│   ├── blue_agent.md          # Target system prompt
│   └── judge_agent.md         # Scoring criteria
├── render.yaml                # Infrastructure as Code
└── .env.example               # Config template
```

## Skills Demonstrated

**Full-Stack Development:**
- RESTful API design
- WebSocket real-time communication
- React state management
- Responsive UI/UX

**AI/ML Engineering:**
- LLM API integration
- Multi-agent systems
- Prompt engineering
- Token optimization

**DevOps/Infrastructure:**
- CI/CD ready configuration
- Environment-based deployment
- PaaS deployment (Render)
- Rate limiting & error handling

**Software Engineering:**
- Async/await patterns
- Type safety (TypeScript)
- Clean architecture
- Production logging

## Notes

Keys from same Groq account share daily quota (100K tokens). For extended testing, use multiple accounts or upgrade to paid tier.
