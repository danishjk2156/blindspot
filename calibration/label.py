"""Turn recorded explanations into labelled calibration cases, one keypress per code block.

    python calibration/label.py --status                 # what's recorded / labelled
    python calibration/label.py --new two_sum good       # create + open the transcript file to dictate into
    python calibration/label.py                          # label every transcript that has no case yet

Layout:
    calibration/snippets/<name>.<py|js|ts|java|cpp>      the code you explain
    calibration/transcripts/<name>_<good|weak>.txt       what you said (dictate with Wispr Flow, save)
    calibration/cases/<name>_<good|weak>.json            created here, used by calibrate.py

Label from the transcript only, never from the model's output, so the check stays independent.
"""
import argparse
import json
import os
import sys
import textwrap
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "backend"))

from app.segmenter import segment  # noqa: E402

LANG = {".py": "python", ".js": "javascript", ".ts": "typescript", ".java": "java", ".cpp": "cpp"}
KEYS = {"c": "correct", "v": "vague", "w": "wrong", "m": "missing"}
RUBRIC = (
    "c = correct (states what the block does, accurately)   v = vague (mentions it, no real behaviour)\n"
    "w = wrong (claims something the code contradicts)      m = missing (never addressed)\n"
    "u = undo last   q = quit this case"
)


def find_snippet(snippets: Path, name: str) -> Path | None:
    for ext in LANG:
        p = snippets / f"{name}{ext}"
        if p.exists():
            return p
    return None


def open_file(p: Path) -> None:
    try:
        os.startfile(p)  # type: ignore[attr-defined]  # Windows only
    except AttributeError:
        print(f"  open this file: {p}")


def split_stem(stem: str) -> tuple[str, str] | None:
    name, _, kind = stem.rpartition("_")
    return (name, kind) if name and kind in ("good", "weak") else None


def status(dirs: dict[str, Path]) -> None:
    names = sorted(p.stem for p in dirs["snippets"].iterdir() if p.suffix in LANG)
    print(f"{'snippet':<18}{'good':<22}{'weak':<22}")
    done = 0
    for n in names:
        row = []
        for kind in ("good", "weak"):
            t = (dirs["transcripts"] / f"{n}_{kind}.txt").exists()
            c = (dirs["cases"] / f"{n}_{kind}.json").exists()
            done += c
            row.append("labelled" if c else "recorded, needs labels" if t else "-")
        print(f"{n:<18}{row[0]:<22}{row[1]:<22}")
    print(f"\n{done} of {len(names) * 2} cases labelled.")


def label_case(snippet: Path, transcript: str, stem: str, cases: Path) -> bool:
    code = snippet.read_text(encoding="utf-8")
    language = LANG[snippet.suffix]
    seg = segment(code, language)
    blocks = seg.blocks
    code_lines = code.splitlines()

    print("\n" + "=" * 78)
    print(f"CASE {stem}  ({len(blocks)} blocks)")
    print("=" * 78)
    print("WHAT YOU SAID:\n" + textwrap.fill(transcript, 78, initial_indent="  ", subsequent_indent="  "))
    print("\n" + RUBRIC + "\n")

    labels: list[str] = []
    i = 0
    while i < len(blocks):
        b = blocks[i]
        print(f"--- block {i + 1}/{len(blocks)}  (lines {b.start}-{b.end})")
        for n in range(b.start, b.end + 1):
            print(f"  {n:>3} | {code_lines[n - 1]}")
        try:
            key = input("  label [c/v/w/m/u/q]: ").strip().lower()
        except EOFError:
            key = "q"
        if key == "q":
            print("  discarded (nothing saved).")
            return False
        if key == "u":
            if i:
                i -= 1
                labels.pop()
            continue
        if key not in KEYS:
            print("  please press c, v, w, m, u or q")
            continue
        labels.append(KEYS[key])
        i += 1

    case = {
        "code": code,
        "language": language,
        "transcript": transcript,
        "labels": {f"{b.start}-{b.end}": lab for b, lab in zip(blocks, labels)},
    }
    cases.mkdir(parents=True, exist_ok=True)
    (cases / f"{stem}.json").write_text(json.dumps(case, indent=2), encoding="utf-8")
    counts = {k: labels.count(k) for k in KEYS.values()}
    print(f"  saved {stem}.json  {counts}")
    return True


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--new", nargs=2, metavar=("NAME", "KIND"), help="create/open a transcript file (KIND: good|weak)")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--redo", action="store_true", help="relabel transcripts that already have a case")
    ap.add_argument("--snippets", default=str(HERE / "snippets"))
    ap.add_argument("--transcripts", default=str(HERE / "transcripts"))
    ap.add_argument("--cases", default=str(HERE / "cases"))
    args = ap.parse_args()
    dirs = {k: Path(getattr(args, k)) for k in ("snippets", "transcripts", "cases")}
    dirs["transcripts"].mkdir(parents=True, exist_ok=True)

    if args.status:
        return status(dirs)

    if args.new:
        name, kind = args.new
        snip = find_snippet(dirs["snippets"], name)
        if kind not in ("good", "weak") or not snip:
            sys.exit(f"Need an existing snippet name and kind good|weak (looked for {name}.* in {dirs['snippets']})")
        t = dirs["transcripts"] / f"{name}_{kind}.txt"
        t.touch(exist_ok=True)
        print(f"Snippet: {snip}\nDictate into: {t}")
        print("good = explain everything correctly.  weak = skip 1-2 blocks, be vague on 1-2, get 1 wrong.")
        open_file(snip)
        open_file(t)
        return

    pending = []
    for t in sorted(dirs["transcripts"].glob("*.txt")):
        parts = split_stem(t.stem)
        if not parts:
            continue
        if (dirs["cases"] / f"{t.stem}.json").exists() and not args.redo:
            continue
        snip = find_snippet(dirs["snippets"], parts[0])
        text = " ".join(t.read_text(encoding="utf-8").split())
        if not snip:
            print(f"skip {t.name}: no snippet called {parts[0]}")
        elif not text:
            print(f"skip {t.name}: empty (dictate into it first)")
        else:
            if len(text.split()) < 20:
                print(f"warning {t.name}: only {len(text.split())} words; the app needs 20+")
            pending.append((t.stem, snip, text))

    if not pending:
        print("Nothing to label. Record transcripts first (see --new), or use --status.")
        return
    for stem, snip, text in pending:
        if not label_case(snip, text, stem, dirs["cases"]):
            break


if __name__ == "__main__":
    main()
