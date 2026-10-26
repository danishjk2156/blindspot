from . import grader, mapper, segmenter, verifier
from .models import UserError


def numbered(code: str) -> str:
    return "\n".join(f"{i:>3} | {line}" for i, line in enumerate(code.splitlines(), start=1))


def run(code: str, language: str, transcript: str) -> dict:
    seg = segmenter.segment(code, language)
    if not seg.blocks:
        raise UserError("Couldn't find any code to grade in this snippet.")
    grades = grader.grade(numbered(code), seg.blocks, transcript)
    verified = verifier.verify(grades, seg.blocks, transcript)
    return mapper.map_lines(code, seg, verified, verifier.coverage(verified))
