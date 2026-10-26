import hashlib
import json
import os
import tempfile
import threading
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SAMPLES_PATH = DATA_DIR / "samples_cache.json"
RUNTIME_PATH = DATA_DIR / "cache.json"

_store: dict[str, dict] = {}
_lock = threading.Lock()


def make_key(code: str, language: str, transcript: str) -> str:
    norm = " ".join(transcript.split()).lower()  # whitespace/case don't change the grade
    payload = f"{language}\0{code.rstrip()}\0{norm}"
    return hashlib.sha256(payload.encode()).hexdigest()


def _read(path: Path) -> dict[str, dict]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def load() -> None:
    with _lock:
        _store.clear()
        _store.update(_read(SAMPLES_PATH))
        _store.update(_read(RUNTIME_PATH))


def get(key: str) -> dict | None:
    with _lock:
        return _store.get(key)


def put(key: str, value: dict, persist: bool = True) -> None:
    with _lock:
        _store[key] = value
        if not persist:
            return
        try:  # a read-only or ephemeral disk must not break grading; the in-memory cache still works
            RUNTIME_PATH.parent.mkdir(parents=True, exist_ok=True)
            fd, tmp = tempfile.mkstemp(dir=RUNTIME_PATH.parent, suffix=".tmp")
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(_store, f)
            os.replace(tmp, RUNTIME_PATH)
        except OSError:
            pass
