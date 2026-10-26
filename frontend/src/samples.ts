import type { Language } from "./types";

export interface Sample {
  name: string;
  language: Language;
  code: string;
  transcript: string;
}

export const samples: Sample[] = [
  {
    name: "Binary search (Python)",
    language: "python",
    code: `def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
    // Deliberate wrong claim (returns -1 when found) and a skipped line (the final return).
    transcript:
      "This function takes a sorted list and a target value. It keeps two pointers, low and high, " +
      "and loops while they haven't crossed. Each time it checks the middle element, and if it finds " +
      "the element it returns minus one. If the middle is smaller than the target it moves the low " +
      "pointer up, otherwise it moves the high pointer down.",
  },
  {
    name: "Debounce (JavaScript, Hinglish)",
    language: "javascript",
    code: `function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
`,
    // Hinglish; the clearTimeout line is described only vaguely.
    transcript:
      "Yeh function ek timer set karta hai jo delay ke baad hi fn ko call karta hai. " +
      "Andar ek closure hai jisme timer variable yaad rehta hai. Har baar jab function call hota hai " +
      "toh pehle wala timer kuch karta hai, phir naya setTimeout lagta hai. " +
      "Timer khatam hone par original arguments ke saath fn chal jaata hai.",
  },
];
