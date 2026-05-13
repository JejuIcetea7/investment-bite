# Signal Status Rules

## Purpose

This document defines exact signal status rules for investment data.

Use these statuses for broad investment interpretation:

- `positive`
- `negative`
- `neutral`
- `caution`
- `insufficient_data`
- `invalid_data`

Use domain-specific labels only as explanatory labels mapped from these statuses.

---

## Status Priority

Always apply status priority in this order:

```text
1. invalid_data
2. insufficient_data
3. caution
4. positive
5. negative
6. neutral
```

If a higher-priority condition is true, do not override it with a lower-priority status.

---

## Invalid Data

Return `invalid_data` when at least one of these conditions is true:

- required input structure cannot be inspected
- required field is missing for the target analysis
- required numeric field is non-numeric
- required denominator is `0`
- required time reference is missing for time-based analysis
- required unit or currency is missing for a unit-sensitive calculation
- duplicate records make the required calculation ambiguous

Required output evidence:

- `reason_codes` must include at least one invalid-data reason.
- `confidence` must be `unknown`.

---

## Insufficient Data

Return `insufficient_data` when the data is structurally valid but cannot support the requested interpretation.

Exact rules:

- Required fields exist but required history length is not met.
- A comparison analysis has only one comparable point.
- A trend analysis has fewer than 2 comparable periods.
- A status score cannot be computed because more than half of required evidence items are missing.
- A text signal has fewer than 2 independent evidence items.

Required output evidence:

- `reason_codes` must include `INSUFFICIENT_DATA`.
- `missing_metrics` or missing evidence items must be listed.
- `confidence` must be `unknown` or `low`.

---

## Caution

Return `caution` when at least one explicit risk condition is true.

Generic caution conditions:

| Data Type | Caution Condition |
|---|---|
| price series | one-period return <= -3%, 7-period return <= -7%, volatility threshold exceeded, or price below reference average by threshold |
| portfolio | single asset weight >= 30% or top 3 asset weight >= 60% |
| financial statement | revenue decline <= -10%, operating margin decline <= -5 percentage points, debt ratio increase >= 20 percentage points, or negative operating cash flow |
| flow data | net outflow is negative and absolute outflow change >= 30% from prior period |
| macro indicator | change crosses an explicitly defined unfavorable threshold |
| text signal | risk/uncertainty evidence count >= positive evidence count and risk count >= 2 |

Required output evidence:

- `risk_reasons` must contain at least one reason.
- `reason_codes` must contain at least one matching reason.
- `confidence` must not be `high` if the risk condition depends on a single unverified source.

---

## Positive

Return `positive` only when:

- `invalid_data`, `insufficient_data`, and `caution` are false.
- Positive evidence count is greater than negative evidence count.
- Positive evidence count is at least the data-type minimum.

Default data-type minimum:

| Data Type | Positive Minimum |
|---|---:|
| price series | 3 positive conditions out of 4 |
| portfolio | 2 positive conditions out of 3 |
| financial statement | 2 positive conditions out of 3 |
| flow data | 2 positive conditions out of 3 |
| macro indicator | 2 positive conditions out of 3 |
| text signal | positive evidence count >= 2 and positive count > negative count |

---

## Negative

Return `negative` only when:

- `invalid_data`, `insufficient_data`, and `caution` are false.
- Negative evidence count is greater than positive evidence count.
- Negative evidence count is at least the data-type minimum.

Default data-type minimum:

| Data Type | Negative Minimum |
|---|---:|
| price series | 3 negative conditions out of 4 |
| portfolio | 2 negative conditions out of 3 |
| financial statement | 2 negative conditions out of 3 |
| flow data | 2 negative conditions out of 3 |
| macro indicator | 2 negative conditions out of 3 |
| text signal | negative evidence count >= 2 and negative count > positive count |

---

## Neutral

Return `neutral` when:

- no higher-priority condition applies
- positive and negative evidence counts are equal
- highest evidence score is below the data-type minimum
- the difference between positive and negative evidence counts is `1` or less
- neutral-specific conditions are met for the data type

Do not call a result neutral because it is unclear. Use `insufficient_data` when evidence is missing.

---

## Data-Type Signal Examples

### Price Series

Positive conditions:

- current value is above the 20-period average
- 5-period average is above the 20-period average
- 7-period return is greater than `0`
- latest one-period return is greater than `0`

Negative conditions:

- current value is below the 20-period average
- 5-period average is below the 20-period average
- 7-period return is less than `0`
- latest one-period return is less than `0`

Neutral conditions:

- absolute current-vs-20-period-average difference is less than `0.5%`
- absolute 5-vs-20-period-average difference is less than `0.5%`
- absolute 7-period return is less than `3%`

### Portfolio Holdings

Positive conditions:

- single largest holding weight is less than `30%`
- top 3 holding weight is less than `60%`
- at least 5 holdings have positive market value

Negative conditions:

- portfolio return is negative when a valid return period exists
- more than 50% of holdings by count have negative return when return data exists
- cash or unclassified assets exceed `40%` without explanation

Caution conditions:

- single largest holding weight is at least `30%`
- top 3 holding weight is at least `60%`
- any holding has negative market value

### Financial Statements

Positive conditions:

- revenue growth is greater than `0%`
- operating margin is greater than `0%`
- net income is greater than `0`

Negative conditions:

- revenue growth is less than `0%`
- operating margin is less than `0%`
- net income is less than `0`

Caution conditions:

- revenue growth is less than or equal to `-10%`
- operating margin decreases by at least `5` percentage points
- debt ratio increases by at least `20` percentage points
- operating cash flow is negative

