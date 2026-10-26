import logging

from rapidfuzz import fuzz

from .models import BlockGrade, GradeResult
from .segmenter import Block

log = logging.getLogger("blindspot.verifier")

THRESHOLD = 85


def _norm(s: str) -> str:
    return " ".join(s.lower().split())


def verify(grades: GradeResult, blocks: list[Block], transcript: str) -> dict[int, BlockGrade]:
    t = _norm(transcript)
    valid_ids = {b.id for b in blocks}
    by_id = {g.block_id: g for g in grades.blocks if g.block_id in valid_ids}
    verified: dict[int, BlockGrade] = {}
    for b in blocks:
        g = by_id.get(b.id)
        if g is None:  # model skipped it
            log.warning("model skipped block %d; marking missing", b.id)
            verified[b.id] = BlockGrade(block_id=b.id, status="missing")
            continue
        if g.status != "missing":
            q = _norm(g.evidence_quote)
            if not q or fuzz.partial_ratio(q, t) < THRESHOLD:  # invented / paraphrased quote
                log.warning("block %d: quote not found in transcript, downgraded %s -> missing", b.id, g.status)
                g = g.model_copy(update={"status": "missing", "evidence_quote": ""})
        else:
            g = g.model_copy(update={"evidence_quote": ""})
        verified[b.id] = g
    return verified


def coverage(verified: dict[int, BlockGrade]) -> float:
    gradable = len(verified)
    if gradable == 0:
        return 0.0
    correct = sum(g.status == "correct" for g in verified.values())
    vague = sum(g.status == "vague" for g in verified.values())
    return round(100 * (correct + 0.5 * vague) / gradable, 1)
