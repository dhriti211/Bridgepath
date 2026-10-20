# Bridgepath

**Your degree still counts.** Bridgepath turns a foreign degree into a personal, sourced, step-by-step plan to get licensed in the US.

About 2 million college-educated immigrants in the US are unemployed or working far below their training, which costs nearly $40 billion a year in lost wages ([Migration Policy Institute, 2021](https://www.migrationpolicy.org/research/brain-waste-college-educated-immigrants)). A nurse from the Philippines works as a caregiver; a civil engineer from India drives for a ride app. The barrier is usually not skill. It is a maze of evaluation services, state boards, exams, English tests and fees that differ by profession and by state.

Bridgepath is an AI agent that reads the official rules live and builds the plan for you.

> Built for the Nebius x NVIDIA Global AI Hackathon, Best Apps & Agents track.

## What it does

1. **You describe your background**: profession, country, degree, experience, target state, English test, and optionally a CV or transcript.
2. **You watch the agent work**: a live feed shows each step and the official sources it finds.
3. **You get a roadmap**: ordered steps, each with cost, time, documents needed and a link to the official source. Total cost and time are calculated from the steps and their dependencies.
4. **Work you can do now**: jobs that use your skills while you relicense.
5. **Ask follow-ups**: "What if I move to Texas?" The agent searches again when needed.
6. **Download a PDF** checklist.

Supported professions today: Registered Nurse, Engineer, K-12 Teacher, in any US state.

## How it uses NVIDIA Nemotron, Nebius Token Factory and Tavily

Every model call goes to **Nebius Token Factory** (OpenAI-compatible API). Each job is routed to the right-sized **NVIDIA Nemotron 3** model, so the app stays fast and credits go further:

| Step | Job | Model / tool |
|---|---|---|
| Intake | Turn the form and CV into a structured profile | **Nemotron Nano** |
| Equivalency | Estimate the US-equivalent degree and the right evaluation service | **Nemotron Ultra** |
| Research | Search state boards, exam bodies and bridge programs; runs in parallel with equivalency | **Tavily Search** |
| Synthesis | Extract requirements from search results, each tied to a source URL | **Nemotron Super** |
| Planning | Order steps by dependency, add costs, durations, documents, bridge jobs, warnings | **Nemotron Ultra** |
| Verification | Keep only links that came from real search results; flag unsourced steps | Deterministic check |
| Follow-up chat | Decide if a fresh search is needed (Nano), then answer (Super) | **Nemotron Nano + Super**, **Tavily** |

Code: model routing in [`backend/app/llm.py`](backend/app/llm.py), the agent in [`backend/app/agent/pipeline.py`](backend/app/agent/pipeline.py), Tavily research and caching in [`backend/app/search.py`](backend/app/search.py).

Bridgepath picks the Nemotron models automatically from the Token Factory model list (Nano, Super, Ultra). You can pin them with `MODEL_FAST`, `MODEL_MEDIUM` and `MODEL_REASONING` in `.env`.

## Run it locally

You need Python 3.11+, Node.js 20+ and Git, plus a [Nebius Token Factory](https://tokenfactory.nebius.com) API key and a [Tavily](https://tavily.com) API key.

```bash
git clone https://github.com/dhriti211/Bridgepath.git
cd Bridgepath
cp .env.example .env        # Windows PowerShell: copy .env.example .env
# open .env and paste your two keys
```

**Backend** (terminal 1):

```bash
cd backend
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python ../scripts/check_setup.py   # checks keys and shows the Nemotron models in use
uvicorn app.main:app --reload --port 8000
```

**Frontend** (terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

**Tests**: `cd backend && pytest` (no API keys needed; the LLM and search are scripted).

## Deploy

The `Dockerfile` builds the frontend and serves it from the FastAPI app on one port. Set `NEBIUS_API_KEY` and `TAVILY_API_KEY` as environment variables on your host (for example Render, or Nebius Serverless Endpoints).

## Project structure

```
backend/
  app/main.py            API: streaming roadmap endpoint, chat, health
  app/llm.py             Token Factory client and Nemotron model routing
  app/search.py          Tavily search with SQLite cache
  app/agent/pipeline.py  The agent: intake → equivalency → research → synthesis → plan → verify
  app/agent/queries.py   Research questions per profession
  app/agent/prompts.py   Prompts for each step
  app/agent/chat.py      Follow-up questions
  tests/
frontend/                React + Vite + Tailwind
scripts/check_setup.py   Verify keys and model access
```

## Disclaimer

Bridgepath gives guidance, not legal or immigration advice. Licensing rules change; always confirm with the official board linked on each step.

## License

[MIT](LICENSE)
