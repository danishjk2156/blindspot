# Calibration: 20 real cases in about 2 hours

Goal: a number you can defend. "Blindspot agrees with my own labels X% of the time on 20 explanations I recorded."
10 snippets x 1 good + 1 weak explanation = 20 cases. Targets: **>= 80% agreement, kappa >= 0.6**.

The 10 snippets are ready in `snippets/` (6 Python, 4 JavaScript, 7-20 gradable blocks each). Use your own code instead if you like; just drop a file there.

## The loop (per take, about 5 minutes)

```bash
python calibration/label.py --new two_sum good     # creates the transcript file, opens it + the snippet
```
1. Read the snippet, then **dictate your explanation with Wispr Flow** into the opened transcript file (Notepad is fine). Save it.
2. Repeat for the `weak` take of the same snippet (below).
3. When you have a batch of transcripts, label them all:

```bash
python calibration/label.py          # one keypress per code block: c / v / w / m
python calibration/label.py --status # see what's done
```
4. After all 20: `python calibration/calibrate.py --local` and read `calibration/report.md`. Use `--pause 6` if Groq rate-limits you.

## Recording rules (these make the number honest)

- **Good take:** explain every block, accurately, in your own words. Don't read the code aloud line by line; say what it *does*. 25-60 words per take is plenty, but at least 20.
- **Weak take:** same snippet, but deliberately: **skip 1-2 blocks**, be **vague** about 1-2 ("then it does something with the pointer"), and get **1 thing wrong** with a plausible mistake. Vary which blocks you skip across snippets.
- Mix it up: record 3-4 takes in **Hinglish** (any snippet), since that's a claim you make in the demo.
- Dictate with Wispr Flow every time, so the transcripts have its real punctuation and filler removal.

## Labelling rules

Label from **what you said**, never from what Blindspot outputs. Don't run the grader until all 20 are labelled.

| Key | Label | Use when |
|---|---|---|
| `c` | correct | you stated what this block does, accurately (any wording) |
| `v` | vague | you referred to it but said nothing concrete about its behaviour |
| `w` | wrong | you claimed something the code contradicts |
| `m` | missing | you never addressed it |

Edge cases: a bare `else:` or a closing line is covered if you described the alternative case; initialisation lines count as covered if you said what's being set up. If unsure between two labels, pick the one a strict teacher would choose, and stay consistent. `u` undoes the last label.

## Ideas for the weak takes

| Snippet | Skip | Vague about | Plausible wrong claim |
|---|---|---|---|
| two_sum | the final `return []` | the `need = target - n` line | "it stores the number as the key and compares indexes" (actually stores value -> index) |
| is_palindrome | the cleaning step | the loop condition | "it moves both pointers outward" (they move inward) |
| merge_sort | the base case | `result.extend(...)` lines | "it splits the list by value, smaller and larger than the middle" |
| bfs_graph | `visited.add` | the queue setup | "it uses a stack so it goes deep first" |
| lru_cache | `popitem` | `move_to_end` | "get removes the key from the cache" |
| valid_parens | the final `return not stack` | the `pairs` dict | "it counts opening and closing brackets and compares totals" |
| throttle | the `return fn.apply` | `lastCall = now` | "it delays calls until the interval has passed" (that's debounce) |
| fetch_retry | the `delay *= 2` line | the `res.ok` check | "it retries immediately with no wait" |
| flatten | the `depth` check | `result.push(item)` | "it removes duplicates while flattening" |
| memoize | `cache.set` | the `JSON.stringify` key | "it caches only the first call forever" |

## Files

- `snippets/` code to explain. `transcripts/` what you said. `cases/` labelled cases (created by `label.py`).
- `seed_cases/` four cases the assistant labelled early on, only to prove the scripts work. Don't mix them into the real run (`calibrate.py --cases calibration/seed_cases` still works on them).
- `report.md` is overwritten each time you run `calibrate.py`.
