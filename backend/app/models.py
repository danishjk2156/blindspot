from typing import Literal

from pydantic import BaseModel, Field, field_validator

Language = Literal["python", "javascript", "typescript", "java", "cpp", "other"]
Status = Literal["correct", "vague", "wrong", "missing", "neutral"]


class AnalyzeRequest(BaseModel):
    code: str = Field(min_length=1)
    language: Language
    transcript: str

    @field_validator("code")
    @classmethod
    def max_150_lines(cls, v: str) -> str:
        if len(v.splitlines()) > 150:
            raise ValueError("Please keep the snippet to 150 lines or fewer.")
        return v

    @field_validator("transcript")
    @classmethod
    def min_20_words(cls, v: str) -> str:
        if len(v.split()) < 20:
            raise ValueError("Explain a bit more. We need at least ~20 words to grade fairly.")
        return v


class LineResult(BaseModel):
    n: int
    status: Status
    quote: str | None = None
    fix: str | None = None


class AnalyzeResponse(BaseModel):
    lines: list[LineResult]
    coverage_pct: float
    cached: bool = False


# --- Grader (LLM) JSON schema ---

class BlockGrade(BaseModel):
    block_id: int
    status: Literal["correct", "vague", "wrong", "missing"]
    evidence_quote: str = ""
    fix: str = ""


class GradeResult(BaseModel):
    blocks: list[BlockGrade]


class UserError(Exception):
    """Bad input the user can fix (maps to HTTP 422)."""


class GraderBusy(Exception):
    """The grader (Groq) failed after retries (maps to HTTP 503)."""
