"""Grade the frontend's demo samples once and store them in data/samples_cache.json.

The frontend's samples.ts is the single source of truth. Node (>=22.6 / 24) loads the
TypeScript file directly, so the cache key always matches what the UI sends.

    python scripts/precompute_samples.py
"""
import argparse
import json
import logging
import subprocess
import sys
import time
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
ROOT = BACKEND.parent
sys.path.insert(0, str(BACKEND))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND / ".env")

from app import cache, pipeline  # noqa: E402


def load_samples() -> list[dict]:
    samples_ts = (ROOT / "frontend" / "src" / "samples.ts").as_uri()
    js = f"import({json.dumps(samples_ts)}).then(m => console.log(JSON.stringify(m.samples)))"
    out = subprocess.run(["node", "-e", js], capture_output=True, text=True, shell=sys.platform == "win32")
    if out.returncode != 0:
        sys.exit(f"Could not read frontend/src/samples.ts with node:\n{out.stderr}")
    return json.loads(out.stdout)


def median_run(code: str, language: str, transcript: str, runs: int, pause: float) -> dict:
    """Grade several times and keep the median-coverage result, so one flaky run isn't cached."""
    results = []
    for i in range(runs):
        if i:
            time.sleep(pause)
        results.append(pipeline.run(code, language, transcript))
        print(f"  run {i + 1}/{runs}: coverage {results[-1]['coverage_pct']}%", flush=True)
    results.sort(key=lambda r: r["coverage_pct"])
    return results[len(results) // 2]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--runs", type=int, default=3, help="gradings per sample; the median is cached (default 3)")
    ap.add_argument("--pause", type=float, default=5.0, help="seconds between gradings, to respect rate limits")
    args = ap.parse_args()
    logging.basicConfig(level=logging.WARNING, format="  ! %(message)s")

    cache_data: dict[str, dict] = {}
    for s in load_samples():
        print(f"Grading {s['name']} ...", flush=True)
        result = median_run(s["code"], s["language"], s["transcript"], args.runs, args.pause)
        cache_data[cache.make_key(s["code"], s["language"], s["transcript"])] = result
        print(f"  cached coverage {result['coverage_pct']}%")
    cache.SAMPLES_PATH.parent.mkdir(parents=True, exist_ok=True)
    cache.SAMPLES_PATH.write_text(json.dumps(cache_data, indent=2), encoding="utf-8")
    print(f"Wrote {len(cache_data)} entries to {cache.SAMPLES_PATH}")


if __name__ == "__main__":
    main()
