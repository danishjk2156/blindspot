from app.mapper import map_lines
from app.models import BlockGrade
from app.segmenter import segment


def test_status_reaches_every_line_and_neutrals_stay_neutral():
    code = "import os\n\nx = foo(\n    1,\n\n    2,\n)\n"
    seg = segment(code, "python")
    verified = {1: BlockGrade(block_id=1, status="wrong", evidence_quote="said it", fix="do this")}
    out = map_lines(code, seg, verified, 0.0)
    by_n = {line["n"]: line for line in out["lines"]}
    assert len(out["lines"]) == 7
    assert by_n[1]["status"] == "neutral" and by_n[2]["status"] == "neutral"
    assert by_n[5]["status"] == "neutral"  # blank line inside the block
    for n in (3, 4, 6, 7):
        assert by_n[n]["status"] == "wrong"
        assert by_n[n]["quote"] == "said it" and by_n[n]["fix"] == "do this"
    assert by_n[1]["quote"] is None
