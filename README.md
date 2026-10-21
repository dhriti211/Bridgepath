# Bridgepath

**Study here. Build your career here.** Bridgepath turns an international student's degree, dates and goals into a personal, sourced plan for working in the US: OPT, STEM OPT, H-1B and the job search, in the right order.

There were 1.18 million international students in the US in 2024/25, 57% of them in STEM, and 294,000 on OPT ([IIE Open Doors 2025](https://www.iie.org/news/open-doors-2025-press-release/)). For them, getting hired is not just about skills. It is a maze of filing windows, unemployment-day limits, E-Verify rules, lottery seasons and sponsorship questions, and the rules keep changing. The answers are spread across USCIS pages, school portals, law-firm blogs and forums.

Bridgepath also helps professionals trained abroad (nurses, engineers and K-12 teachers) get relicensed in their state. About 2 million college-educated immigrants in the US are unemployed or working below their training ([Migration Policy Institute, 2021](https://www.migrationpolicy.org/research/brain-waste-college-educated-immigrants)).

> Built by an international student for the Nebius x NVIDIA Global AI Hackathon, Best Apps & Agents track.

## What it does

**For international (F-1) students**

1. **Tell it where you are**: degree level, major, STEM or not, program end date, OPT dates if you have them, the job you want, and optionally your resume.
2. **Pick a goal**: the agent reads your background and suggests three realistic, different goals (for example big tech, a cap-exempt university lab, or a stretch path toward O-1A). Pick one or type your own.
3. **Get your key dates**: your OPT filing window, grace period, STEM OPT window and H-1B season, calculated from your own dates using the F-1 rules, with a live countdown.
4. **Get your roadmap**: ordered career and immigration steps, each with cost, time, documents and a link to USCIS or another official source, plus the kinds of employers to target.
5. **Track and ask**: tick off steps, ask follow-ups ("What if I lose my job on OPT?"), and download a PDF.

**For professionals trained abroad**: enter your profession, country, degree and state, and get a relicensing roadmap with costs, exams, sources and jobs you can do while you relicense.

## How it uses NVIDIA Nemotron, Nebius Token Factory and Tavily

Every model call goes to **Nebius Token Factory** (OpenAI-compatible API). Each job is routed to the right-sized **NVIDIA Nemotron 3** model, so the app stays fast and credits go further:

Student mode:

| Step | Job | Model / tool |
|---|---|---|
| Intake | Turn the form and resume into a structured profile | **Nemotron Nano** |
| Goals | Suggest three realistic goals for this person | **Nemotron Super** |
| Key dates | OPT, STEM OPT, grace period and H-1B dates from the F-1 rules | Deterministic ([`dates.py`](backend/app/agent/dates.py)) |
| Research | Search USCIS, Study in the States, DOL and sponsor data | **Tavily Search** |
| Synthesis | Extract the current rules, each tied to a source URL | **Nemotron Super** |
| Planning | Order career and visa steps around the key dates | **Nemotron Ultra** |
| Verification | Keep only links that came from real search results | Deterministic check |

Licensing mode:

| Step | Job | Model / tool |
|---|---|---|
| Intake | Turn the form and CV into a structured profile | **Nemotron Nano** |
| Equivalency | Estimate the US-equivalent degree and the right evaluation service | **Nemotron Ultra** |
| Research | Search state boards, exam bodies and bridge programs; runs in parallel with equivalency | **Tavily Search** |
| Synthesis | Extract requirements from search results, each tied to a source URL | **Nemotron Super** |
| Planning | Order steps by dependency, add costs, durations, documents, bridge jobs, warnings | **Nemotron Ultra** |
| Verification | Keep only links that came from real search results; flag unsourced steps | Deterministic check |
| Follow-up chat | Decide if a fresh search is needed (Nano), then answer (Super) | **Nemotron Nano + Super**, **Tavily** |

Code: model routing in [`backend/app/llm.py`](backend/app/llm.py), the agents in [`backend/app/agent/student.py`](backend/app/agent/student.py) and [`backend/app/agent/pipeline.py`](backend/app/agent/pipeline.py), Tavily research and caching in [`backend/app/search.py`](backend/app/search.py).

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
  app/agent/student.py   Student agent: goals, then dates → research → synthesis → plan → verify
  app/agent/dates.py     F-1 key dates (OPT, STEM OPT, grace period, H-1B season)
  app/agent/pipeline.py  Licensing agent: intake → equivalency → research → synthesis → plan → verify
  app/agent/queries.py   Research questions per profession and for students
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
