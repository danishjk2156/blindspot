"""Split code into gradable blocks and mark ungraded (neutral) lines."""
import ast
import re
from dataclasses import dataclass, field


@dataclass
class Block:
    id: int
    start: int  # 1-based, inclusive
    end: int  # inclusive
    kind: str
    text: str


@dataclass
class Segmentation:
    blocks: list[Block]
    neutral_lines: set[int] = field(default_factory=set)


def segment(code: str, language: str) -> Segmentation:
    if language == "python":
        try:
            return _segment_python(code)
        except SyntaxError:
            pass  # pasted fragment: fall back to the generic segmenter
    return _segment_generic(code)


def _finalize(lines: list[str], spans: list[tuple[int, int, str]]) -> Segmentation:
    spans = sorted(spans)
    blocks = [
        Block(id=i, start=s, end=e, kind=k, text="\n".join(lines[s - 1 : e]))
        for i, (s, e, k) in enumerate(spans, start=1)
    ]
    covered = {n for b in blocks for n in range(b.start, b.end + 1)}
    neutral = {n for n in range(1, len(lines) + 1) if n not in covered}
    for b in blocks:  # blank / comment-only lines inside a multi-line block
        for n in range(b.start, b.end + 1):
            t = lines[n - 1].strip()
            if not t or t.startswith("#") or t.startswith("//"):
                neutral.add(n)
    return Segmentation(blocks=blocks, neutral_lines=neutral)


# ---------------------------------------------------------------- Python

def _segment_python(code: str) -> Segmentation:
    tree = ast.parse(code)
    lines = code.splitlines()
    spans: list[tuple[int, int, str]] = []

    def trim_header(start: int, end: int) -> int:
        while end > start and (not lines[end - 1].strip() or lines[end - 1].strip().startswith("#")):
            end -= 1
        return end

    def add_clause(lo: int, hi: int, kind: str) -> None:
        """Find a bare `else:` / `finally:` line in (lo, hi]."""
        for n in range(hi, lo, -1):
            if re.match(rf"\s*{kind}\b", lines[n - 1]):
                spans.append((n, n, kind))
                return

    def is_docstring(s: ast.stmt) -> bool:
        return isinstance(s, ast.Expr) and isinstance(s.value, ast.Constant) and isinstance(s.value.value, str)

    def visit(stmts: list[ast.stmt]) -> None:
        for s in stmts:
            if isinstance(s, (ast.Import, ast.ImportFrom, ast.Pass)) or is_docstring(s):
                continue
            kind = type(s).__name__.lower()
            body = getattr(s, "body", None)
            if not isinstance(body, list) or not body:  # simple statement
                spans.append((s.lineno, s.end_lineno, kind))
                continue
            if body[0].lineno == s.lineno:  # one-liner like `if x: return y`
                spans.append((s.lineno, s.end_lineno, kind))
                continue
            spans.append((s.lineno, trim_header(s.lineno, body[0].lineno - 1), kind))
            visit(body)
            handlers = getattr(s, "handlers", [])
            for h in handlers:
                if h.body[0].lineno == h.lineno:
                    spans.append((h.lineno, h.end_lineno, "except"))
                    continue
                spans.append((h.lineno, trim_header(h.lineno, h.body[0].lineno - 1), "except"))
                visit(h.body)
            ends = [body[-1].end_lineno] + [h.end_lineno for h in handlers]
            orelse = getattr(s, "orelse", [])
            if orelse:
                is_elif = isinstance(s, ast.If) and re.match(r"\s*elif\b", lines[orelse[0].lineno - 1])
                if not is_elif:
                    add_clause(max(ends), orelse[0].lineno - 1, "else")
                visit(orelse)
                ends.append(orelse[-1].end_lineno)
            finalbody = getattr(s, "finalbody", [])
            if finalbody:
                add_clause(max(ends), finalbody[0].lineno - 1, "finally")
                visit(finalbody)

    visit(tree.body)
    return _finalize(lines, spans)


# --------------------------------------------------------------- Generic

_CLOSERS = re.compile(r"^[\}\)\];,]+$")
_SKIP_PREFIX = ("import ", "#include", "package ", "using ", "#define", "#pragma")
_TRAILING_OP = ("+", "-", "*", "/", "&&", "||", "=", "?", ":", "\\", ".", "&", "|", "<", ">", "!")
_STRINGS = re.compile(r"(\"[^\"]*\"|'[^']*'|`[^`]*`)")


def _ends_open(line: str) -> bool:
    return bool(line) and line.endswith(_TRAILING_OP) and not line.endswith(("++", "--", "*/"))


def _segment_generic(code: str) -> Segmentation:
    lines = code.splitlines()
    spans: list[tuple[int, int, str]] = []
    in_comment = False
    balance = 0
    cur: list[int] | None = None  # [start, end]

    def flush() -> None:
        nonlocal cur
        if cur:
            spans.append((cur[0], cur[1], "stmt"))
        cur = None

    for i, raw in enumerate(lines, start=1):
        t = raw.strip()
        if in_comment:
            if "*/" in t:
                in_comment = False
            continue
        if t.startswith("/*"):
            in_comment = "*/" not in t
            continue
        closer = bool(t) and _CLOSERS.match(t) is not None
        neutral = not t or t.startswith(("//", "#")) or closer or t.startswith(_SKIP_PREFIX)
        pending = cur is not None and (balance > 0 or _ends_open(lines[cur[1] - 1].strip()))

        if closer:
            balance = max(0, balance - t.count(")") - t.count("]"))
        elif not neutral:
            c = _STRINGS.sub("", t)
            balance = max(0, balance + c.count("(") + c.count("[") - c.count(")") - c.count("]"))

        if neutral:
            if pending and closer and cur is not None:  # closing line of a multi-line call
                cur[1] = i
            elif not pending:
                flush()
            continue
        if pending or t.startswith("."):
            if cur is None:
                cur = [i, i]
            cur[1] = i
        else:
            flush()
            cur = [i, i]
    flush()
    return _finalize(lines, spans)
