import pytest
from fastapi.testclient import TestClient

from app import cache, grader, main
from app.models import GradeResult, GraderBusy

CODE = "def f(a):\n    return a + 1\n"
TRANSCRIPT = (
    "This function f takes a number a and then it returns that number plus one so basically "
    "it increments the input by exactly one every time it is called"
)


@pytest.fixture(autouse=True)
def isolate_cache(tmp_path, monkeypatch):
    monkeypatch.setattr(cache, "SAMPLES_PATH", tmp_path / "samples.json")
    monkeypatch.setattr(cache, "RUNTIME_PATH", tmp_path / "cache.json")
    cache.load()


@pytest.fixture
def client():
    return TestClient(main.app)


def body(**kw):
    return {"code": CODE, "language": "python", "transcript": TRANSCRIPT, **kw}


def fake_grade(numbered_code, blocks, transcript):
    return GradeResult.model_validate(
        {
            "blocks": [
                {"block_id": 1, "status": "correct", "evidence_quote": "takes a number a", "fix": "Defines f(a)."},
                {"block_id": 2, "status": "wrong", "evidence_quote": "totally invented words here", "fix": "x"},
            ]
        }
    )


def test_analyze_grades_verifies_and_caches(client, monkeypatch):
    calls = []
    monkeypatch.setattr(grader, "grade", lambda *a: calls.append(1) or fake_grade(*a))
    r = client.post("/analyze", json=body())
    assert r.status_code == 200
    data = r.json()
    assert [l["status"] for l in data["lines"]] == ["correct", "missing"]  # invented quote downgraded
    assert data["coverage_pct"] == 50.0 and data["cached"] is False

    r2 = client.post("/analyze", json=body(transcript="  " + TRANSCRIPT.upper()))
    assert r2.json()["cached"] is True
    assert len(calls) == 1


def test_too_many_lines_is_friendly_422(client):
    r = client.post("/analyze", json=body(code="x = 1\n" * 151))
    assert r.status_code == 422
    assert r.json() == {"detail": "Please keep the snippet to 150 lines or fewer."}


def test_short_transcript_is_422(client):
    r = client.post("/analyze", json=body(transcript="too short here"))
    assert r.status_code == 422
    assert "at least ~20 words" in r.json()["detail"]


def test_no_gradable_code_is_422(client):
    r = client.post("/analyze", json=body(code="# just a comment\n"))
    assert r.status_code == 422


def test_grader_failure_is_503(client, monkeypatch):
    def boom(*a):
        raise GraderBusy("The grader is busy, try again in a few seconds.")

    monkeypatch.setattr(grader, "grade", boom)
    r = client.post("/analyze", json=body())
    assert r.status_code == 503
    assert "busy" in r.json()["detail"]
