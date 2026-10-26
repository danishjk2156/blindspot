"""Measure how well Blindspot's grading agrees with hand labels.

    python calibration/calibrate.py --local                 # grade in-process (no server needed)
    python calibration/calibrate.py --api http://localhost:8000   # via a running server
    python calibration/calibrate.py --print-blocks calibration/cases/foo_good.json

Case files live in calibration/cases/<name>_<good|weak>.json:
    {"code": "...", "language": "python", "transcript": "...",
     "labels": {"1-1": "correct", "3-4": "vague", "7-7": "wrong"}}
Labels are keyed by line range, not block id, so they survive segmenter changes.
Writes calibration/report.md.
"""
import argparse
import json
import statistics
import sys
import time
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
BACKEND = HERE.parent / "backend"
sys.path.insert(0, str(BACKEND))

STATUSES = ["correct", "vague", "wrong", "missing"]
CREDIT = {"correct": 1.0, "vague": 0.5, "wrong": 0.0, "missing": 0.0}


def parse_range(key: str) -> tuple[int, int]:
    a, _, b = key.partition("-")
    return int(a), int(b or a)


def coverage_of(statuses: list[str]) -> float:
    return round(100 * sum(CREDIT[s] for s in statuses) / len(statuses), 1) if statuses else 0.0


def predicted_status(lines: list[dict], lo: int, hi: int) -> str:
    """Block status = most common status among its graded lines (ties: first seen)."""
    seen = [l["status"] for l in lines if lo <= l["n"] <= hi and l["status"] != "neutral"]
    if not seen:
        return "missing"
    return Counter(seen).most_common(1)[0][0]


def cohen_kappa(pairs: list[tuple[str, str]]) -> float:
    n = len(pairs)
    if not n:
        return float("nan")
    po = sum(a == b for a, b in pairs) / n
    ca, cb = Counter(a for a, _ in pairs), Counter(b for _, b in pairs)
    pe = sum(ca[s] * cb[s] for s in STATUSES) / (n * n)
    return 1.0 if pe == 1 else (po - pe) / (1 - pe)


def make_grader(args):
    if args.local:
        from dotenv import load_dotenv

        load_dotenv(BACKEND / ".env")
        from app import pipeline

        return lambda c: pipeline.run(c["code"], c["language"], c["transcript"])

    import httpx

    def call(c: dict) -> dict:
        r = httpx.post(
            f"{args.api}/analyze",
            params={"nocache": 1},
            json={k: c[k] for k in ("code", "language", "transcript")},
            timeout=120,
        )
        if r.status_code != 200:
            raise RuntimeError(f"{r.status_code}: {r.text[:200]}")
        return r.json()

    return call


def print_blocks(path: Path) -> None:
    from app.segmenter import segment

    case = json.loads(path.read_text(encoding="utf-8"))
    seg = segment(case["code"], case["language"])
    for b in seg.blocks:
        first = b.text.splitlines()[0].strip()
        print(f'"{b.start}-{b.end}": "",   # {first[:60]}')


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--api", default="http://localhost:8000", help="backend URL (needs DEBUG=1 for ?nocache=1)")
    ap.add_argument("--local", action="store_true", help="grade in-process instead of calling the API")
    ap.add_argument("--cases", default=str(HERE / "cases"))
    ap.add_argument("--pause", type=float, default=4.0, help="seconds between cases (rate limits)")
    ap.add_argument("--print-blocks", metavar="CASE.json", help="print the segmenter's blocks to help labelling")
    ap.add_argument("--out", default=str(HERE / "report.md"))
    args = ap.parse_args()

    if args.print_blocks:
        print_blocks(Path(args.print_blocks))
        return

    grade = make_grader(args)
    files = sorted(Path(args.cases).glob("*.json"))
    if not files:
        sys.exit(f"No case files in {args.cases}. Record and label some first: see calibration/README.md")

    pairs: list[tuple[str, str]] = []  # (human, predicted)
    rows, cov_err, by_kind = [], [], {"good": [], "weak": []}
    for i, f in enumerate(files):
        case = json.loads(f.read_text(encoding="utf-8"))
        if i:
            time.sleep(args.pause)
        try:
            res = grade(case)
        except Exception as e:  # keep going; report the failure
            print(f"{f.name}: FAILED ({e})")
            rows.append((f.name, None, None, None, None))
            continue
        human, pred = [], []
        for rng, label in case["labels"].items():
            lo, hi = parse_range(rng)
            p = predicted_status(res["lines"], lo, hi)
            human.append(label)
            pred.append(p)
            pairs.append((label, p))
            if p != label:
                print(f"  {f.name} lines {rng}: human={label} blindspot={p}")
        agree = sum(a == b for a, b in zip(human, pred))
        h_cov, p_cov = coverage_of(human), res["coverage_pct"]
        cov_err.append(abs(h_cov - p_cov))
        kind = "good" if f.stem.endswith("_good") else "weak" if f.stem.endswith("_weak") else None
        if kind:
            by_kind[kind].append(p_cov)
        rows.append((f.name, agree, len(human), h_cov, p_cov))
        print(f"{f.name}: {agree}/{len(human)} blocks agree, coverage human {h_cov}% vs blindspot {p_cov}%")

    n = len(pairs)
    if not n:
        sys.exit("No cases graded successfully.")
    exact = 100 * sum(a == b for a, b in pairs) / n
    kappa = cohen_kappa(pairs)
    mae = statistics.mean(cov_err)
    matrix = {h: Counter(p for hh, p in pairs if hh == h) for h in STATUSES}
    sep = (
        statistics.mean(by_kind["good"]) - statistics.mean(by_kind["weak"])
        if by_kind["good"] and by_kind["weak"]
        else None
    )

    L = ["# Calibration report", ""]
    L += [f"- Cases graded: {len(cov_err)} / {len(files)} ({n} labelled blocks)"]
    L += [f"- **Exact agreement: {exact:.1f}%** (target >= 80%)"]
    L += [f"- **Cohen's kappa: {kappa:.2f}** (target >= 0.60)"]
    L += [f"- Coverage MAE vs human labels: {mae:.1f} points"]
    L += [
        "- Good vs weak separation: "
        + (f"{sep:.1f} points (mean good {statistics.mean(by_kind['good']):.1f}%, "
           f"mean weak {statistics.mean(by_kind['weak']):.1f}%)" if sep is not None else "n/a (need both _good and _weak cases)")
    ]
    L += ["", "## Confusion matrix (rows = human label, columns = Blindspot)", ""]
    L += ["| human \\ model | " + " | ".join(STATUSES) + " |", "|---|" + "---|" * len(STATUSES)]
    for h in STATUSES:
        L += [f"| **{h}** | " + " | ".join(str(matrix[h][p]) for p in STATUSES) + " |"]
    L += ["", "## Per case", "", "| case | blocks agreeing | human coverage | Blindspot coverage |", "|---|---|---|---|"]
    for name, agree, total, h_cov, p_cov in rows:
        L += [f"| {name} | FAILED | - | - |" if agree is None else f"| {name} | {agree}/{total} | {h_cov}% | {p_cov}% |"]
    Path(args.out).write_text("\n".join(L) + "\n", encoding="utf-8")
    print("\n" + "\n".join(L[2:8]))
    print(f"\nWrote {args.out}")


if __name__ == "__main__":
    main()
