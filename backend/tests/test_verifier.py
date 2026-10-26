from app.models import BlockGrade, GradeResult
from app.segmenter import Block
from app.verifier import coverage, verify

TRANSCRIPT = "This function takes a sorted list and a target, then it returns minus one when it finds the element."
BLOCKS = [Block(id=i, start=i, end=i, kind="x", text="") for i in (1, 2, 3)]


def g(i, status, quote="", fix="f"):
    return BlockGrade(block_id=i, status=status, evidence_quote=quote, fix=fix)


def test_real_quote_is_kept():
    res = verify(GradeResult(blocks=[g(1, "correct", "takes a sorted list and a target")]), BLOCKS[:1], TRANSCRIPT)
    assert res[1].status == "correct"
    assert res[1].evidence_quote


def test_made_up_quote_is_downgraded_to_missing():
    res = verify(GradeResult(blocks=[g(1, "correct", "it uses a hash map for constant time lookup")]), BLOCKS[:1], TRANSCRIPT)
    assert res[1].status == "missing"
    assert res[1].evidence_quote == ""


def test_empty_quote_on_non_missing_is_downgraded():
    res = verify(GradeResult(blocks=[g(1, "wrong", "")]), BLOCKS[:1], TRANSCRIPT)
    assert res[1].status == "missing"


def test_quote_matching_tolerates_case_and_whitespace():
    res = verify(GradeResult(blocks=[g(1, "vague", "RETURNS  minus one\nwhen it finds")]), BLOCKS[:1], TRANSCRIPT)
    assert res[1].status == "vague"


def test_skipped_block_is_filled_and_invented_id_dropped():
    res = verify(GradeResult(blocks=[g(1, "missing"), g(99, "correct", "takes a sorted list")]), BLOCKS[:2], TRANSCRIPT)
    assert set(res) == {1, 2}
    assert res[2].status == "missing"


def test_coverage_math():
    v = {
        1: g(1, "correct"),
        2: g(2, "vague"),
        3: g(3, "wrong"),
        4: g(4, "missing"),
    }
    assert coverage(v) == 37.5  # (1 + 0.5) / 4
    assert coverage({}) == 0.0
