# Blindspot

> Explain your code out loud. Blindspot shows you, line by line, the parts you didn't really understand.

Paste a snippet, hold your [Wispr Flow](https://wisprflow.ai) hotkey and explain the code in English or Hinglish, then click **Find my blindspots**. Every line is coloured, and hovering shows the exact words you said and a one-line fix.

| Colour | Status | Meaning |
|---|---|---|
| Green | `correct` | You explained this block accurately. |
| Yellow | `vague` | You mentioned it without saying what it does. |
| Red | `wrong` | What you said contradicts the code. |
| Grey | `missing` | You didn't cover this block. |
| none | `neutral` | Blank lines, comments, imports, bare braces. Not graded. |

## Why you can trust the output

- **Quotes are verified.** Every "you said X" is fuzzy-matched (rapidfuzz, threshold 85) against your transcript. A quote the model invented downgrades that block to *missing*.
- **The score is plain Python.** Coverage = (correct + 0.5 × vague) ÷ graded blocks, calculated outside the model.
- **Deterministic structure.** Code is split into blocks by Python `ast` (or a brace/indent splitter for other languages), so the model only grades, it doesn't decide what the blocks are.
- **No audio handling.** Wispr Flow types into the textbox like a keyboard, so there is no speech-to-text code to break.

## Architecture

```
Wispr Flow (OS dictation) -> React textarea -> POST /analyze
  FastAPI: validate -> cache -> segmenter -> grader (Groq LLM, JSON) -> verifier -> line mapper -> JSON
```

| Path | What it does |
|---|---|
| `backend/app/segmenter.py` | code -> blocks + neutral lines |
| `backend/app/grader.py` | one Groq chat-completion call (`openai/gpt-oss-120b`), JSON output, retries on 429 |
| `backend/app/verifier.py` | quote verification, gap filling, coverage |
| `backend/app/mapper.py` | block grades -> per-line results |
| `backend/app/cache.py` | sha256-keyed cache, in memory + `data/cache.json` |
| `backend/data/samples_cache.json` | precomputed results for the two demo samples |
| `frontend/` | Vite + React + TypeScript + Tailwind |
| `calibration/` | hand-labelled cases and the agreement script |

## Run locally

Prerequisites: Python 3.11+, Node 22+ and a [Groq API key](https://console.groq.com/keys).

```bash
# backend
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt      # macOS/Linux: .venv/bin/pip
cp .env.example .env                               # then set GROQ_API_KEY
.venv/Scripts/python -m uvicorn app.main:app --port 8000
```

```bash
# frontend (second terminal)
cd frontend
npm install
cp .env.example .env                               # VITE_API_URL=http://localhost:8000
npm run dev                                        # http://localhost:5173
```

Tests (Groq is mocked, no key needed): `cd backend && .venv/Scripts/python -m pytest`

### Environment variables

| Where | Variable | Purpose |
|---|---|---|
| backend | `GROQ_API_KEY` | required, never commit it |
| backend | `GROQ_MODEL` | optional, default `openai/gpt-oss-120b` |
| backend | `FRONTEND_ORIGIN` | allowed CORS origin(s), comma-separated |
| backend | `DEBUG` | `1` allows `?nocache=1` (used by calibration over the API) |
| frontend | `VITE_API_URL` | backend base URL, set at **build** time |

## Precompute the demo samples

The two demo samples in `frontend/src/samples.ts` are graded once and shipped in `backend/data/samples_cache.json`, so the live demo is instant and doesn't touch the rate limit. Re-run this after changing a sample or the grader prompt, and commit the result:

```bash
cd backend && .venv/Scripts/python scripts/precompute_samples.py
```

## Calibration

`calibration/calibrate.py` grades hand-labelled cases and reports exact agreement, Cohen's kappa, a confusion matrix, coverage error and good-vs-weak separation (written to `calibration/report.md`).

```bash
python calibration/calibrate.py --print-blocks calibration/cases/foo_good.json   # block ranges to label
python calibration/calibrate.py --local                                          # grade in-process
```

Case files are `calibration/cases/<name>_<good|weak>.json` with labels keyed by line range. Targets: **>= 80 % agreement, kappa >= 0.6**.

**Current numbers are from 4 seed cases labelled by the author, not an independent test:** 84.4 % agreement, kappa 0.56. Replace them with your own recorded cases (10 snippets x good/weak) before quoting a figure.

## Deploy

The backend goes to Render, the frontend to Vercel. Deploy the backend first, because the frontend needs its URL.

> **Repo layout:** `render.yaml` and the Vercel settings assume this folder is the repository root. If it lives inside a bigger repo, set Render's `rootDir` to `<folder>/backend` and Vercel's *Root Directory* to `<folder>/frontend`.

### 1. Backend on Render

1. Push the repo to GitHub.
2. Render dashboard -> **New -> Blueprint**, pick the repo. It reads `render.yaml` (free web service, `backend/` root, health check `/health`).
3. When prompted, set `GROQ_API_KEY`. Leave `FRONTEND_ORIGIN` empty for now.
4. Once live, check `https://<service>.onrender.com/health` returns `{"ok":true}`.

### 2. Frontend on Vercel

1. Vercel -> **Add New -> Project**, import the repo, set **Root Directory** to `frontend` (`vercel.json` supplies the build settings).
2. Add the environment variable `VITE_API_URL` = your Render URL (no trailing slash), then deploy.

### 3. Close the loop

Back on Render, set `FRONTEND_ORIGIN` to your Vercel URL (e.g. `https://blindspot.vercel.app`; add `,http://localhost:5173` to keep local dev working) and let it redeploy. Without this the browser blocks API calls with a CORS error.

### Demo-day notes

- Render's free tier **sleeps after ~15 min idle**; the first request takes about a minute. Open `/health` shortly before presenting.
- The samples come from the precomputed cache, but anything you type fresh calls Groq, which is rate-limited on the free tier. Don't grade many new snippets in quick succession.
- The runtime cache file doesn't survive Render restarts (ephemeral disk). The committed `samples_cache.json` does.

## Demo script (90 s)

1. Open the app. The binary-search sample is loaded.
2. Hold the Wispr Flow hotkey and explain it live, deliberately saying "returns -1 when it finds it".
3. **Find my blindspots**. Line 6 turns red, and hovering shows your words and the fix.
4. Point at the grey lines you skipped and the coverage badge.
5. Load the JavaScript sample and explain it in Hinglish.
6. Close with the calibration number and the line: every quote shown is verified against what you actually said.
