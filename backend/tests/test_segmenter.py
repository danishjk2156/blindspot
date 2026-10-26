from app.segmenter import segment

BINARY_SEARCH = """import math

def binary_search(arr, target):
    \"\"\"Find target.\"\"\"
    lo, hi = 0, len(arr) - 1
    # main loop
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
"""


def ranges(seg):
    return [(b.start, b.end) for b in seg.blocks]


def test_python_binary_search_blocks():
    seg = segment(BINARY_SEARCH, "python")
    assert ranges(seg) == [(3, 3), (5, 5), (7, 7), (8, 8), (9, 9), (10, 10), (11, 11), (12, 12), (13, 13), (14, 14), (15, 15)]
    assert {1, 2, 4, 6} <= seg.neutral_lines  # import, blank, docstring, comment
    assert seg.blocks[0].id == 1 and seg.blocks[0].text == "def binary_search(arr, target):"


def test_python_try_except_finally_and_oneliner():
    code = "try:\n    x = 1\nexcept ValueError:\n    x = 2\nelse:\n    x = 3\nfinally:\n    print(x)\nif x: y = 1\n"
    seg = segment(code, "python")
    assert ranges(seg) == [(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9)]


def test_python_multiline_statement_is_one_block():
    code = "x = foo(\n    1,\n    2,\n)\ny = 2\n"
    assert ranges(segment(code, "python")) == [(1, 4), (5, 5)]


def test_syntax_error_falls_back_to_generic():
    code = "for i in range(3)\n    print(i)\n"  # missing colon
    seg = segment(code, "python")
    assert seg.blocks  # did not raise


JS = """// debounce
import x from 'y';

function debounce(fn, ms) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => {
      fn.apply(this, args);
    }, ms);
  };
}
"""


def test_generic_js_blocks_and_neutrals():
    seg = segment(JS, "javascript")
    # the setTimeout(...) call spans lines 8-10 and stays one block
    assert ranges(seg) == [(4, 4), (5, 5), (6, 6), (7, 7), (8, 10)]
    # comment, import, blank line and bare closers are never graded
    assert seg.neutral_lines == {1, 2, 3, 11, 12}


def test_generic_multiline_call_stays_together():
    code = "const r = compute(\n  a,\n  b\n);\nnext();\n"
    assert ranges(segment(code, "javascript")) == [(1, 4), (5, 5)]


def test_generic_block_comment_and_include_neutral():
    code = "#include <stdio.h>\n/* hello\n   world */\nint main() {\n  return 0;\n}\n"
    seg = segment(code, "cpp")
    assert ranges(seg) == [(4, 4), (5, 5)]
