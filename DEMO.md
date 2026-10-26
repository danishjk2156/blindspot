# Blindspot demo kit

Everything you need for the 90-second video: what to say into Wispr Flow, what to say to the camera, and a pre-flight checklist.

## 0. Know this before you record

- **Speaking live gets a fresh grading (about 5-15 s, longer if rate-limited).** The instant "cached" result only happens when the transcript is *exactly* the sample text (case and spacing are ignored). Wispr Flow won't reproduce the sample word for word.
- So pick one per take:
  - **Live take:** speak the script, click **Find my blindspots**, and cut or speed up the wait in editing. Looks most real.
  - **Instant take:** click a sample button and don't touch the text. It returns "From cache" immediately. Good for the second half of the video or as a fallback.
- Wispr Flow removes filler words and adds punctuation. That's fine, because grading is by meaning and the quote check tolerates small differences.
- Fresh gradings vary a little run to run (coverage can move by roughly 10 points). Don't promise an exact number on camera. Do a practice run and keep the best take.

## 1. Scripts to speak (into the explanation box, with Wispr Flow)

Click into the explanation box first, hold **Ctrl+Win** (Windows) or **Fn** (Mac), speak, release. Clear the box before each take.

### A. Binary search, the "weak" take (the hero demo, about 25 s)

Contains one deliberate **wrong** claim (line 6) and skips the final `return -1`:

> This function takes a sorted list and a target value. It keeps two pointers, low and high, and loops while they haven't crossed. Each time it checks the middle element, and if it finds the element it returns minus one. If the middle is smaller than the target it moves the low pointer up, otherwise it moves the high pointer down.

Expected result: line 6 `return mid` **red**, final `return -1` **grey**, a couple of **yellow** lines. Coverage around 55-75%.

### B. Binary search, the "good" take (optional before/after, about 30 s)

> This function takes a sorted list and a target value and returns the index of the target. It sets two pointers, lo at the start and hi at the last index. While lo is less than or equal to hi it computes the middle index mid as the average of lo and hi. If the element at mid equals the target it returns mid. Otherwise, if the element at mid is smaller than the target, it moves lo to mid plus one, else it moves hi to mid minus one. If the loop ends without finding the target, the function returns minus one.

Expected: almost everything green and coverage near 100%. Great contrast right after take A ("same code, now I actually understood it").

### C. Debounce in Hinglish (about 20 s)

Load the **Debounce (JavaScript, Hinglish)** sample, then speak:

> Yeh function ek timer set karta hai jo delay ke baad hi fn ko call karta hai. Andar ek closure hai jisme timer variable yaad rehta hai. Har baar jab function call hota hai toh pehle wala timer kuch karta hai, phir naya setTimeout lagta hai. Timer khatam hone par original arguments ke saath fn chal jaata hai.

Expected: mostly green, with the `clearTimeout` line **yellow** (you said "kuch karta hai", something, and didn't say it cancels the old timer). This is the "it understands Hinglish and catches vague wording" beat.

If Wispr Flow mangles the Hinglish, use the **Debounce sample button** (cached, instant) and say: "I dictated this in Hinglish."

## 2. The 90-second video, shot by shot

| Time | On screen | Say |
|---|---|---|
| 0:00-0:08 | Login page, click **Continue as guest** | "When you explain code out loud, nobody tells you which lines you skipped, or got wrong. Blindspot does." |
| 0:08-0:15 | Workspace, binary search loaded, point at the 3 steps | "Paste code, explain it out loud with Wispr Flow, find your blindspots." |
| 0:15-0:40 | Click the explanation box, **speak script A** (box fills with text) | (you're speaking the script) |
| 0:40-0:48 | Click **Find my blindspots**, spinner (speed up or cut) | "It grades every block of code against what I actually said." |
| 0:48-1:00 | Results: hover **line 6 (red)** to show the tooltip, then the **grey** last line, then the coverage ring | "Red: I said it returns minus one when found. It shows my exact words and the fix. Grey: I never mentioned the final return. And here's my coverage score." |
| 1:00-1:12 | Click the Debounce sample, speak script C (or show cached result), hover the yellow line | "It works in Hinglish too, and it catches vague answers, like here where I never said it cancels the old timer." |
| 1:12-1:22 | Cut to README calibration section or `report.md` | "Every quote it shows is verified against my transcript, and the score is plain Python, not the model. On my labelled cases it agrees with me about X% of the time." |
| 1:22-1:30 | Back to the app, logo visible | "Blindspot. Explain your code. See what you missed." |

Tips: record at 1080p with the browser zoomed to about 110% so the code is readable, hide bookmarks and other tabs, and keep your cursor still while Wispr Flow types.

## 3. Pre-flight checklist

**The night before**
- [ ] Replace the 4 seed calibration cases with your own recorded ones, run `python calibration/calibrate.py --local`, and note the real agreement %. Don't quote 84% unless it's from your own cases.
- [ ] If you changed a sample or the grader prompt: `cd backend && .venv/Scripts/python scripts/precompute_samples.py`, then commit `backend/data/samples_cache.json`.
- [ ] Deployed? Open the Vercel URL, click **Continue as guest**, grade a sample. If you see a CORS error, `FRONTEND_ORIGIN` on Render doesn't match the Vercel URL.
- [ ] Wispr Flow is installed, signed in, and the hotkey works in Chrome (try it in any text box).

**10 minutes before**
- [ ] Open `https://<your-render-url>/health` until it says `{"ok":true}` (the free tier sleeps and takes about a minute to wake).
- [ ] Do one full practice run: speak script A, grade, check line 6 is red.
- [ ] Close other tabs and apps, turn on Do Not Disturb, and check the microphone input level.
- [ ] Log out, so the video starts on the login page.

**While recording**
- [ ] Clear the explanation box before each take.
- [ ] Don't grade many fresh snippets in a row. Groq's free tier rate-limits (you'd see "The grader is busy, try again").
- [ ] If a result looks odd (say line 5 shows yellow or red), just rerun or re-record that take. Variation between runs is normal.

## 4. If something goes wrong

| Problem | Fix |
|---|---|
| "The grader is busy" | Wait 20 s and click again, or use a sample button (cached, no API call). |
| Can't reach the server | Backend asleep or down. Hit `/health`, wait for it, retry. Locally: start `uvicorn` on port 8000. |
| CORS error in the console | Set `FRONTEND_ORIGIN` on Render to the exact Vercel URL (no trailing slash) and let it redeploy. |
| Wispr Flow types in the wrong place | Click inside the explanation box first, so it has focus. |
| Result isn't what you wanted for the shot | Re-record the take. Or use the cached sample result for that part. |

## 5. Honest answers for judges

- **Is the model trustworthy?** Every quote is fuzzy-matched against the transcript, and a made-up quote downgrades the block to "missing". The coverage score is calculated in Python.
- **Is login real?** No. It's a demo: accounts live only in the browser. Say so if asked.
- **How accurate is it?** Quote your own calibration number from `calibration/report.md`, and say how many cases it's based on.
- **Why Groq and not Gemini?** Fast, free, and structured JSON output. The grader is one file, so swapping the model is easy.
