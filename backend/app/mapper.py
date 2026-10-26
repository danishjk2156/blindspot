from .models import BlockGrade, LineResult
from .segmenter import Segmentation


def map_lines(code: str, seg: Segmentation, verified: dict[int, BlockGrade], cov: float) -> dict:
    n_lines = len(code.splitlines())
    info = {n: LineResult(n=n, status="neutral") for n in range(1, n_lines + 1)}
    for b in seg.blocks:
        g = verified[b.id]
        for n in range(b.start, b.end + 1):
            if n in seg.neutral_lines:
                continue
            info[n] = LineResult(n=n, status=g.status, quote=g.evidence_quote or None, fix=g.fix or None)
    return {"lines": [info[n].model_dump() for n in sorted(info)], "coverage_pct": cov}
