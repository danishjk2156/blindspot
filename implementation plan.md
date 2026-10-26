# Blindspot — Implementation Plan

> **Update:** the grader now runs on **Groq's free tier** (`openai/gpt-oss-120b`, key in `GROQ_API_KEY`) through a plain HTTPS call, not Gemini / `google-genai`. Wherever this original plan says Gemini, read Groq. The rest of the design (segmenter, verifier, mapper, cache) is unchanged. See `README.md` for the current architecture.

> Explain your code out loud. Blindspot shows you, line by line, the parts you didn't really understand.

---

## 1. The Problem

The fastest way to find out whether you understand a piece of code is to explain it out loud. This is the idea behind rubber-duck debugging and the Feynman technique. Students, bootcamp learners and engineers preparing for interviews all use it.

The rubber duck never answers, though. When you explain code, you can't tell:

- which lines you skipped without noticing,
- which lines you described vaguely ("then it does some stuff with the pointer"),
- which lines you described **wrongly** ("it returns -1 when it finds the element").

Typing a full explanation is slow, so people don't bother. Asking a chatbot "did I explain this right?" gives a paragraph of general feedback that isn't tied to specific lines. It also tends to praise you, and it may say you covered something you never mentioned.

**What's missing:** a fast, spoken way to explain code that gives honest, line-level feedback you can check, showing exactly where your understanding has gaps.

---

## 2. The Solution

**Blindspot** is a two-pane web app:

1. Paste (or pick) a code snippet. It appears on the left with line numbers.
2. Click into the explanation box on the right, hold the Wispr Flow hotkey and **explain the code out loud**, in English or Hinglish. Wispr Flow types your words into the box.
3. Click **"Find my blindspots"**.
4. Every code line is coloured:

| Colour | Status | Meaning |
|---|---|---|
| 🟩 Green | `correct` | You explained this block accurately. |
| 🟨 Yellow | `vague` | You mentioned it, but without saying what it actually does. |
| 🟥 Red | `wrong` | What you said contradicts what the code does. |
| ⬜ Grey | `missing` | You didn't cover this block at all. |
| (none) | `neutral` | Blank lines, comments, imports and braces. These aren't graded. |

5. Hover over a line to see **the exact phrase you said** about it and **a one-line fix**.
6. A **coverage badge** shows your overall score.

**Why it can be trusted:** every "you said X" claim is checked against your transcript with fuzzy string matching. If the model makes up a quote, that block is downgraded to *missing*. The score is calculated in plain Python, not by the model.

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│  USER                                                                     │
│   speaks ──► [1] Wispr Flow (OS-level dictation, Fn / Ctrl+Win)          │
│                    │ types cleaned text into the focused textarea         │
└────────────────────┼─────────────────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ [2] React frontend (Vite + TS)                                            │
│   CodePane (line numbers, colours, tooltips) │ ExplanationPanel + button │
│   state: code, language, transcript, result   │ CoverageBadge            │
└────────────────────┬─────────────────────────────────────────────────────┘
                     │ POST /analyze {code, language, transcript}
                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ [3] FastAPI /analyze                                                      │
│   Pydantic validation ─► cache lookup (sha256) ──hit──► return cached     │
│                                │ miss                                     │
│                                ▼                                          │
│   [4] Segmenter ──blocks──► [5] Grader (Gemini 2.5 Flash, JSON schema)   │
│     (ast / brace+indent)          │ raw block grades                      │
│                                   ▼                                       │
│                          [6] Verifier (rapidfuzz ≥ 85, fill gaps,         │
│                                        coverage % in Python)              │
│                                   │ verified block grades                 │
│                                   ▼                                       │
│                          [7] Line mapper ─► {lines[], coverage_pct}       │
│                                   │                                       │
│                         store in cache ─► JSON response                   │
└──────────────────────────────────────────────────────────────────────────┘

 [8] Calibration script (offline) ── calls /analyze on hand-labelled cases ─► agreement %
```

**How data moves through a request:**

`code + transcript` → validate → hash → (cache) → **segment** into blocks → **grade** blocks with one LLM call → **verify** the quotes and calculate coverage → **map** block grades to lines → JSON → UI colours the lines.

---

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Voice input | **Wispr Flow** (desktop app) | Dictation that works in any text box, removes filler words and handles Hinglish. Needs no integration code. |
| Frontend | **React 18 + Vite + TypeScript** | Fast dev server, typed API contract, easy static deploy. |
| Styling | **Tailwind CSS** | Status colours as utility classes. No time spent on CSS. |
| Backend | **Python 3.11 + FastAPI + Uvicorn** | Async, automatic OpenAPI docs, Pydantic built in. |
| Validation | **Pydantic v2** | Request validation, and the same models describe the Gemini response schema. |
| LLM | **Gemini 2.5 Flash** via `google-genai` SDK | Fast and cheap, with native structured JSON output (`response_schema`). |
| Fuzzy matching | **rapidfuzz** | Fast C++ `partial_ratio` for checking quotes. |
| Code parsing | Python **`ast`** (stdlib) | Exact statement line ranges for Python. |
| Cache | In-memory `dict` + JSON file on disk | No infrastructure. Precomputed sample results ship with the repo. |
| Config | `python-dotenv` | `GEMINI_API_KEY` from `.env`, never committed. |
| Deploy | Frontend → **Vercel**; backend → **Render / Railway** | Free tiers, deploy from git push. |
| Testing | **pytest** + FastAPI `TestClient` | Unit tests for segmenter, verifier and mapper; Gemini is mocked. |

---

## 5. Repository Layout

```
blindspot/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, /analyze route, error handlers
│   │   ├── models.py          # Pydantic request/response + Gemini schema models
│   │   ├── cache.py           # hashing + dict/JSON-file cache
│   │   ├── segmenter.py       # code → blocks (Python ast + generic fallback)
│   │   ├── grader.py          # Gemini call + prompt
│   │   ├── verifier.py        # quote verification + coverage maths
│   │   ├── mapper.py          # blocks → per-line output
│   │   └── pipeline.py        # glue: segment → grade → verify → map
│   ├── data/
│   │   ├── samples_cache.json # precomputed results for the 2 demo snippets
│   │   └── cache.json         # runtime cache (gitignored)
│   ├── scripts/
│   │   └── precompute_samples.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example           # GEMINI_API_KEY=
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts             # analyze() fetch wrapper
│   │   ├── types.ts           # mirrors backend response
│   │   ├── samples.ts         # 2 demo snippets + transcripts
│   │   └── components/
│   │       ├── CodePane.tsx
│   │       ├── CodeLine.tsx
│   │       ├── ExplanationPanel.tsx
│   │       └── CoverageBadge.tsx
│   └── package.json
├── calibration/
│   ├── cases/                 # 10 snippets × {good, weak} explanations, hand-labelled
│   └── calibrate.py
└── README.md
```

---

## 6. Technical Implementation, Component by Component

### 6.1 Wispr Flow — input layer

**What it is:** a system-wide dictation app, not an API. Blindspot never talks to Wispr Flow directly.

**How it works in practice:**
- The user clicks into the explanation `<textarea>`, holds **Fn** (macOS) or **Ctrl+Win** (Windows) and speaks.
- Flow transcribes the speech, removes filler words ("um", "basically", "like"), handles mixed Hindi-English, and types the result into whichever text field has focus.
- To the app it looks exactly like the user typed. The `onChange` handler fires as usual.

**What we build to support it (frontend only):**
- A large, auto-focused `<textarea>` with the placeholder *"Hold Fn / Ctrl+Win and explain the code out loud…"*.
- A small hint chip under the box showing the hotkey for the user's OS (`navigator.userAgent` check).
- A live word counter (`transcript.trim().split(/\s+/).length`), so the user knows when they've reached the 20-word minimum.
- No integration code, no API keys and no audio handling. **This is a deliberate design choice:** we don't build speech-to-text, so we can't break it.

---

### 6.2 React frontend

**Layout:** a CSS grid with two columns (`grid-cols-[3fr_2fr]`). It stacks vertically on narrow screens.

**State (in `App.tsx`, plain `useState`, no state library needed):**

```ts
const [code, setCode]             = useState(samples[0].code);
const [language, setLanguage]     = useState<Language>(samples[0].language);
const [transcript, setTranscript] = useState(samples[0].transcript);
const [result, setResult]         = useState<AnalyzeResponse | null>(null);
const [loading, setLoading]       = useState(false);
const [error, setError]           = useState<string | null>(null);
```

**Types (`types.ts`), which mirror the backend:**

```ts
export type Status = "correct" | "vague" | "wrong" | "missing" | "neutral";
export interface LineResult { n: number; status: Status; quote: string | null; fix: string | null; }
export interface AnalyzeResponse { lines: LineResult[]; coverage_pct: number; cached: boolean; }
```

**API call (`api.ts`):**

```ts
export async function analyze(body: {code: string; language: string; transcript: string}) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Something went wrong");
  return data as AnalyzeResponse;
}
```

**Components:**

| Component | Responsibility |
|---|---|
| `CodePane` | Has two modes. **Edit:** a `<textarea>` for pasting code. **Review:** after analysis, renders one `CodeLine` per line. Includes a language `<select>` (python / javascript / java / cpp / other). Editing the code clears `result`, so old colours never sit on new code. |
| `CodeLine` | A row with a line-number gutter and a `<pre>` holding that line. Its background class comes from a map: `{correct:"bg-green-100", vague:"bg-yellow-100", wrong:"bg-red-100", missing:"bg-gray-200", neutral:""}`. On hover it shows a tooltip (absolute-positioned div) with **"You said:" "…quote…"** and **"Fix:" …**. A missing line shows "You didn't mention this." |
| `ExplanationPanel` | The textarea, word counter, Wispr hint and the **"Find my blindspots"** button. The button is disabled while `loading` or while the word count is below 20, and shows a spinner while loading. |
| `CoverageBadge` | A large percentage with a colour band (≥80 green, ≥50 yellow, otherwise red), plus counts per status ("6 correct · 2 vague · 1 wrong · 3 missing"). The counts are worked out on the client from `lines`, using unique blocks. |

**Samples (`samples.ts`):** two snippets that load on first open. Each has a pre-written transcript, so judges can click the button straight away:
1. **Binary search (Python)**, with a transcript containing one deliberate **wrong** claim ("returns -1 when found") and one skipped line.
2. **Debounce function (JavaScript)**, with a Hinglish transcript ("yeh function ek timer set karta hai…") and one vague explanation.

Their results are already in `samples_cache.json`, so they return instantly and never use Gemini quota.

---

### 6.3 FastAPI `/analyze` endpoint

**Request and response models (`models.py`):**

```python
from pydantic import BaseModel, Field, field_validator
from typing import Literal

Language = Literal["python", "javascript", "typescript", "java", "cpp", "other"]
Status   = Literal["correct", "vague", "wrong", "missing", "neutral"]

class AnalyzeRequest(BaseModel):
    code: str = Field(min_length=1)
    language: Language
    transcript: str

    @field_validator("code")
    @classmethod
    def max_150_lines(cls, v: str) -> str:
        if len(v.splitlines()) > 150:
            raise ValueError("Please keep the snippet to 150 lines or fewer.")
        return v

    @field_validator("transcript")
    @classmethod
    def min_20_words(cls, v: str) -> str:
        if len(v.split()) < 20:
            raise ValueError("Explain a bit more. We need at least ~20 words to grade fairly.")
        return v

class LineResult(BaseModel):
    n: int
    status: Status
    quote: str | None = None
    fix: str | None = None

class AnalyzeResponse(BaseModel):
    lines: list[LineResult]
    coverage_pct: float
    cached: bool = False
```

**Route (`main.py`):**

```python
app = FastAPI(title="Blindspot")
app.add_middleware(CORSMiddleware, allow_origins=[FRONTEND_ORIGIN], allow_methods=["POST"], allow_headers=["*"])

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    key = cache.make_key(req.code, req.language, req.transcript)
    if (hit := cache.get(key)) is not None:
        return {**hit, "cached": True}
    result = await run_in_threadpool(pipeline.run, req.code, req.language, req.transcript)
    cache.put(key, result)
    return result
```

**Friendly errors:** a custom `RequestValidationError` handler turns Pydantic's error list into a single string, `{"detail": "Please keep the snippet to 150 lines or fewer."}`, returned with status **422**. Gemini failures (timeouts, 429s) are caught in the pipeline and return **503** with *"The grader is busy, try again in a few seconds."*

**Cache (`cache.py`):**

```python
def make_key(code: str, language: str, transcript: str) -> str:
    norm = " ".join(transcript.split()).lower()          # whitespace/case don't change the grade
    payload = f"{language}\0{code.rstrip()}\0{norm}"
    return hashlib.sha256(payload.encode()).hexdigest()
```

- `_store: dict[str, dict]` is loaded at startup from `samples_cache.json` (committed) and `cache.json` (runtime, gitignored).
- `put()` writes to the dict and saves `cache.json` atomically (write to a temp file, then `os.replace`).
- `scripts/precompute_samples.py` runs the two samples through `pipeline.run` once and writes `samples_cache.json`. **This is why the live demo never hits Gemini rate limits.**

---

### 6.4 Segmenter

**Goal:** split the code into gradable **blocks** (a loop header, a condition, a return, an assignment) and mark the lines that shouldn't be graded as **neutral**.

**Output type:**

```python
@dataclass
class Block:
    id: int
    start: int          # 1-based, inclusive
    end: int            # inclusive
    kind: str           # "for", "if", "return", "assign", "def", ...
    text: str           # source lines start..end

@dataclass
class Segmentation:
    blocks: list[Block]
    neutral_lines: set[int]
```

**Python path (`ast`):**

```python
def segment_python(code: str) -> Segmentation:
    tree = ast.parse(code)
    blocks = []

    def visit(stmts):
        for s in stmts:
            if isinstance(s, (ast.Import, ast.ImportFrom, ast.Pass)) or _is_docstring(s):
                continue                                    # neutral
            if hasattr(s, "body"):                          # compound: def/class/for/while/if/with/try
                header_end = s.body[0].lineno - 1           # header = lineno .. line before body
                add(s.lineno, max(header_end, s.lineno), type(s).__name__.lower())
                visit(s.body)
                if getattr(s, "orelse", None):              # elif/else branches
                    visit_orelse(s)
                for h in getattr(s, "handlers", []):        # except blocks
                    add(h.lineno, h.body[0].lineno - 1 or h.lineno, "except"); visit(h.body)
            else:                                           # simple statement
                add(s.lineno, s.end_lineno, type(s).__name__.lower())
    visit(tree.body)
    ...
```

- **Compound statements** split into a header block (e.g. `for i in range(n):`), then their body is visited recursively. Nested logic gets its own blocks instead of one large block.
- `else:` / `elif` lines are found from `orelse[0].lineno` and the source text, so they get their own small block.
- **Neutral lines** are every line not covered by a block: blank lines, `#` comments, imports, docstrings, `pass`.
- If `ast.parse` raises `SyntaxError` (e.g. a pasted fragment), we **fall back to the generic segmenter** instead of failing.

**Generic path (JS, Java, C++, other):**

1. Mark a line neutral if, after stripping, it is empty, starts with `//`, `#` or `*`, is inside `/* … */`, is just `}`, `};` or `})`, or starts with `import`, `#include`, `package` or `using`.
2. Start a new block at any non-neutral line that:
   - starts with a control keyword (`if`, `else`, `for`, `while`, `switch`, `case`, `return`, `try`, `catch`, `function`, `def`, `class`, or a method signature regex), **or**
   - follows a line ending in `{` or `;`, **or**
   - has a different indent from the previous non-neutral line.
3. Continue a block while a statement isn't finished (open `(` or `[`, or the line ends with an operator), so multi-line calls stay together.

**Why this matters:** without the neutral filter, `}` and blank lines would count as "missing", and every score would be unfairly low.

---

### 6.5 Grader (Gemini 2.5 Flash)

**One call per request.** The prompt contains:
1. The **numbered code** (`f"{i:>3} | {line}"`), so the model can refer to lines.
2. The **block list**: `[{"block_id": 3, "lines": "7-9", "text": "..."}]`.
3. The **transcript**.

**Structured output via the SDK:**

```python
from google import genai
from google.genai import types

class BlockGrade(BaseModel):
    block_id: int
    status: Literal["correct", "vague", "wrong", "missing"]
    evidence_quote: str          # verbatim from transcript, "" if missing
    fix: str                     # one sentence, what the block actually does

class GradeResult(BaseModel):
    blocks: list[BlockGrade]

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

def grade(numbered_code: str, blocks: list[Block], transcript: str) -> GradeResult:
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=build_prompt(numbered_code, blocks, transcript),
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0,
            response_mime_type="application/json",
            response_schema=GradeResult,
        ),
    )
    return resp.parsed   # already a GradeResult instance
```

**System prompt, with the three key rules:**

```
You grade how well a spoken explanation covers each block of code.
For EVERY block_id, return a status:
- correct: the explanation states what this block does, accurately.
- vague:   the block is referenced but its actual behaviour is not stated.
- wrong:   the explanation makes a claim about this block that contradicts the code.
- missing: the explanation never addresses this block.

Rules:
1. Judge MEANING, not keywords. "it keeps halving the range" covers `mid = (lo+hi)//2`
   even though the word "mid" is never said.
2. The explanation may be in Hinglish (Hindi + English, Roman script). Treat it exactly
   like English. "agar element mil gaya toh index return karta hai" is a valid explanation.
3. evidence_quote MUST be copied word-for-word from the transcript (a contiguous span,
   5-25 words). Never paraphrase. If status is missing, evidence_quote is "".
4. fix: one short sentence describing what the block really does. Write it as a
   correction for wrong, a sharper version for vague, and the explanation itself for missing.
```

**Reliability settings:** `temperature=0` keeps grading consistent between runs. One retry with exponential backoff on 429/5xx. The call times out after 30 seconds. The API key is read from the environment only.

---

### 6.6 Verifier (anti-hallucination)

This is the answer when judges ask about reliability: **the model's claims are checked, not trusted.**

```python
from rapidfuzz import fuzz

THRESHOLD = 85

def verify(grades: GradeResult, blocks: list[Block], transcript: str) -> dict[int, BlockGrade]:
    t = " ".join(transcript.lower().split())
    by_id = {g.block_id: g for g in grades.blocks if g.block_id in {b.id for b in blocks}}
    verified = {}
    for b in blocks:
        g = by_id.get(b.id)
        if g is None:                                                     # Gemini skipped it
            verified[b.id] = BlockGrade(block_id=b.id, status="missing", evidence_quote="", fix="")
            continue
        if g.status != "missing":
            q = " ".join(g.evidence_quote.lower().split())
            if not q or fuzz.partial_ratio(q, t) < THRESHOLD:           # quote not in transcript
                g = g.model_copy(update={"status": "missing", "evidence_quote": ""})
        verified[b.id] = g
    return verified

def coverage(verified: dict[int, BlockGrade]) -> float:
    gradable = len(verified)
    if gradable == 0:
        return 0.0
    correct = sum(g.status == "correct" for g in verified.values())
    vague   = sum(g.status == "vague"   for g in verified.values())
    return round(100 * (correct + 0.5 * vague) / gradable, 1)
```

- **`partial_ratio`** finds the best-matching substring of the transcript, so a correct quote scores about 100 even inside a long transcript. Lower-casing and whitespace normalisation absorb small differences in Wispr Flow's punctuation.
- A quote **below 85** means the model made up or paraphrased evidence, so the block becomes **missing** (grey). We downgrade rather than upgrade because a false "you got it" is worse than a false "you missed it".
- Block IDs **the model left out** are filled in as missing. IDs it **made up** are dropped.
- **Coverage** = (correct + 0.5 × vague) ÷ gradable blocks. Wrong and missing count as 0. It is calculated in Python, so the number is predictable and testable.

---

### 6.7 Line mapper

Turns block-level results into what the UI renders: one entry per line.

```python
def map_lines(code: str, seg: Segmentation, verified: dict[int, BlockGrade], cov: float) -> dict:
    n_lines = len(code.splitlines())
    line_info = {n: LineResult(n=n, status="neutral") for n in range(1, n_lines + 1)}
    for b in seg.blocks:
        g = verified[b.id]
        for n in range(b.start, b.end + 1):
            if n in seg.neutral_lines:      # e.g. a blank line inside a multi-line block
                continue
            line_info[n] = LineResult(n=n, status=g.status,
                                      quote=g.evidence_quote or None, fix=g.fix or None)
    return {"lines": [line_info[n].model_dump() for n in sorted(line_info)], "coverage_pct": cov}
```

**Pipeline glue (`pipeline.py`):**

```python
def run(code, language, transcript):
    seg      = segmenter.segment(code, language)
    if not seg.blocks:
        raise UserError("Couldn't find any code to grade in this snippet.")
    grades   = grader.grade(numbered(code), seg.blocks, transcript)
    verified = verifier.verify(grades, seg.blocks, transcript)
    return mapper.map_lines(code, seg, verified, verifier.coverage(verified))
```

**Response example:**

```json
{
  "lines": [
    {"n": 1, "status": "correct", "quote": "takes a sorted list and a target", "fix": "Defines binary_search(arr, target)."},
    {"n": 2, "status": "neutral", "quote": null, "fix": null},
    {"n": 7, "status": "wrong", "quote": "returns -1 when it finds the element", "fix": "It returns mid when found; -1 means not found."}
  ],
  "coverage_pct": 62.5,
  "cached": false
}
```

---

### 6.8 Calibration script (offline, not part of the app)

**Purpose:** a real number showing that the grading agrees with a human. It goes in the README and the demo video.

**Data format (`calibration/cases/<name>_<good|weak>.json`):**

```json
{
  "code": "...", "language": "python",
  "transcript": "...",
  "labels": { "1-1": "correct", "3-4": "vague", "7-7": "wrong" }
}
```

Labels are keyed by **line range**, not block id, so they still apply if the segmenter changes. A helper (`calibrate.py --print-blocks case.json`) prints the segmenter's blocks to make hand-labelling quick.

**Procedure:**
1. Pick 10 snippets of your own code (mixed Python and JS, 15–60 lines each).
2. Record a **good** and a **weak** explanation for each with Wispr Flow, giving 20 cases.
3. Label each block by hand.
4. Run `python calibration/calibrate.py --api http://localhost:8000`.

**What the script does:**
- POSTs each case to `/analyze` (with a cache-busting flag, `?nocache=1`, accepted only when `DEBUG=1`).
- Reduces the per-line response back to per-block statuses and compares them with the labels.
- Reports:
  - **Exact agreement %** (block status matches the label),
  - **Cohen's κ** (agreement corrected for chance),
  - a **4×4 confusion matrix** (correct / vague / wrong / missing),
  - **coverage MAE** (Blindspot's % compared with the % calculated from human labels),
  - **good vs. weak separation** (mean coverage of good explanations minus weak ones; this should be large).
- Writes `calibration/report.md`.

Target: **≥ 80 % exact agreement** and **κ ≥ 0.6**. If agreement is low, tune the prompt wording and the verifier threshold, then re-run. The script makes it a loop: change, measure, keep or revert.

---

## 7. Testing Strategy

| Test | What it checks |
|---|---|
| `test_segmenter.py` | Binary-search code → expected block ranges; comments, imports, blank lines and `}` are neutral; `SyntaxError` falls back to generic. |
| `test_verifier.py` | A made-up quote is downgraded to missing; a skipped block is filled in; a made-up block id is dropped; coverage maths on fixed inputs. |
| `test_mapper.py` | Block status reaches every line; neutral lines stay neutral. |
| `test_api.py` | 151-line code → 422 with a friendly message; 10-word transcript → 422; cache hit returns `cached: true`; Gemini mocked with `monkeypatch`. |
| Manual | Real Wispr Flow dictation in Chrome on Windows and macOS; Hinglish sample. |

---

## 8. Build Timeline (hackathon)

| Phase | Hours | Output |
|---|---|---|
| 1. Scaffold | 0–1 | Vite + FastAPI repos, CORS, `/analyze` returning a stub response. |
| 2. Segmenter + mapper | 1–3 | Python `ast` and generic segmenters with unit tests; UI colours stub lines. |
| 3. Grader | 3–5 | Gemini call with schema and prompt; first real results. |
| 4. Verifier + coverage | 5–6 | Quote check, gap filling, coverage badge. |
| 5. Frontend polish | 6–8 | Tooltips, badge, samples, error states, loading spinner, responsive layout. |
| 6. Cache + precompute | 8–9 | Hash cache, `samples_cache.json`. |
| 7. Calibration | 9–11 | 20 labelled cases, agreement report, prompt tuning. |
| 8. Deploy + demo | 11–12 | Vercel and Render deploys, README with the calibration number, demo video. |

---

## 9. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Gemini rate limits during judging | Samples precomputed; hash cache; one retry with backoff; friendly 503. |
| The model makes up "you said…" quotes | Verifier with rapidfuzz ≥ 85; failed quotes downgrade to missing. |
| Scores are inconsistent between runs | `temperature=0`; JSON schema; coverage worked out in Python; cache returns the same answer for the same input. |
| Scores are unfairly low | Neutral-line filtering in the segmenter; vague earns half credit. |
| Hinglish not understood | An explicit prompt rule; a Hinglish sample in the calibration set. |
| Pasted code doesn't parse | Generic brace/indent segmenter as a fallback. |
| Large inputs are slow or expensive | 150-line cap; one LLM call per request. |
| API key leaks | Read from the environment only; `.env` gitignored; `.env.example` committed. |

---

## 10. Demo Script (90 seconds)

1. Open the app. The binary-search sample is already loaded.
2. Hold Fn, explain the code live with Wispr Flow, deliberately saying "returns -1 when it finds it".
3. Click **Find my blindspots**. Line 7 turns **red**; hover shows your exact words and the fix.
4. Point out the grey lines you skipped and the coverage badge.
5. Switch to the JS sample and explain it in Hinglish. It is graded the same way.
6. Close with the calibration number: *"Blindspot agrees with hand labels X % of the time, and every quote it shows you is verified against what you actually said."*
