# Calibration report

- Cases graded: 4 / 4 (32 labelled blocks)
- **Exact agreement: 84.4%** (target >= 80%)
- **Cohen's kappa: 0.56** (target >= 0.60)
- Coverage MAE vs human labels: 3.6 points
- Good vs weak separation: 35.9 points (mean good 100.0%, mean weak 64.1%)

## Confusion matrix (rows = human label, columns = Blindspot)

| human \ model | correct | vague | wrong | missing |
|---|---|---|---|---|
| **correct** | 25 | 0 | 0 | 0 |
| **vague** | 1 | 1 | 1 | 2 |
| **wrong** | 0 | 0 | 0 | 1 |
| **missing** | 0 | 0 | 0 | 1 |

## Per case

| case | blocks agreeing | human coverage | Blindspot coverage |
|---|---|---|---|
| binary_search_good.json | 11/11 | 100.0% | 100.0% |
| binary_search_weak.json | 9/11 | 72.7% | 68.2% |
| debounce_good.json | 5/5 | 100.0% | 100.0% |
| debounce_weak.json | 2/5 | 70.0% | 60.0% |
