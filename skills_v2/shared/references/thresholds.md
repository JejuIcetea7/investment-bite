# Price-Series Threshold Rules

## Purpose

This document defines exact threshold rules for price time series analysis.

Use this document only for price-like time series data, such as:

- stock prices
- ETF prices
- crypto prices
- index levels
- fund net asset values
- other investment values with comparable time points

For investment data that is not price time series, use:

- `investment-analysis-principles.md`
- `data-quality-criteria.md`
- `signal-status-rules.md`
- `visualization-guidelines.md`

---

## Units

Use these units consistently:

| Metric | Unit |
|---|---|
| return values | percent number |
| volatility values | percent number |
| moving average values | same unit as input price |
| volume change | percent number |

Example:

```text
3.82 means 3.82%, not 0.0382.
```

---

## Required Price-Series Inputs

Minimum fields:

| Field | Requirement |
|---|---|
| reference time | required |
| price basis | required |

Accepted price basis examples:

- close
- adjusted close
- net asset value
- index level

When this project uses the field name `close`, it means the selected price basis.

---

## Minimum Data Counts

| Metric or Analysis | Minimum Comparable Points |
|---|---:|
| latest value | 1 |
| one-period return | 2 |
| 5-period moving average | 5 |
| 20-period moving average | 20 |
| 60-period moving average | 60 |
| 7-period return | 8 |
| 30-period return | 31 |
| 20-return volatility | 21 |

If the minimum count is not met, return `null` for that metric and record the metric as unavailable.

---

## Price-Series Status Values

Use these price-specific status values:

| Price Status | Common Signal | Korean Label |
|---|---|---|
| `up` | `positive` | 상승 |
| `down` | `negative` | 하락 |
| `sideways` | `neutral` | 횡보 |
| `caution` | `caution` | 주의 |
| `insufficient_data` | `insufficient_data` | 데이터 부족 |
| `invalid_data` | `invalid_data` | 데이터 오류 |

---

## Status Priority

Apply status priority in this exact order:

```text
1. invalid_data
2. insufficient_data
3. caution
4. up
5. down
6. sideways
```

If a higher-priority condition is true, do not override it with a lower-priority status.

---

## Invalid Data Rules

Return `invalid_data` when at least one condition is true:

- required input object is missing
- metrics object is missing
- required numeric field used for status is a string, `NaN`, `Infinity`, or `-Infinity`
- latest price basis is missing
- latest price basis is less than or equal to `0`
- required denominator for a calculated metric is `0`

Required reason code:

- `INVALID_INPUT`

---

## Insufficient Data Rules

Return `insufficient_data` when the input is structurally valid but price status cannot be interpreted.

Exact condition:

```text
If 2 or more of these 3 metrics are null, return insufficient_data:
- weekly_return
- price_vs_ma20_pct
- volatility_20d
```

Also return `insufficient_data` when:

- only `daily_return` is available
- no directional score can be calculated

Required reason code:

- `INSUFFICIENT_METRICS`

---

## Volatility Level

| Condition | volatility_level |
|---|---|
| `volatility_20d` is `null` | `unknown` |
| `volatility_20d < 10` | `low` |
| `10 <= volatility_20d < 25` | `medium` |
| `volatility_20d >= 25` | `high` |

---

## Caution Rules

Return `caution` when any condition is true:

| Risk Reason | Condition |
|---|---|
| `SHARP_DAILY_DROP` | `daily_return <= -3.0` |
| `SHARP_WEEKLY_DROP` | `weekly_return <= -7.0` |
| `HIGH_VOLATILITY` | `volatility_20d >= 25` |
| `PRICE_WELL_BELOW_MA20` | `price_vs_ma20_pct <= -5.0` |
| `VOLUME_SPIKE_WITH_PRICE_SWING` | `volume_change_rate >= 50` and `abs(daily_return) >= 2.0` |

If more than one caution condition is true, include all matching `risk_reasons` in the order shown above.

---

## Direction Scores

Calculate only with non-null metrics.

### Up Score

| Condition | Points | Reason Code |
|---|---:|---|
| `price_vs_ma20_pct > 0` | 1 | `PRICE_ABOVE_MA20` |
| `ma5_vs_ma20_pct > 0` | 1 | `MA5_ABOVE_MA20` |
| `weekly_return > 0` | 1 | `WEEKLY_RETURN_POSITIVE` |
| `daily_return > 0` | 1 | `DAILY_RETURN_POSITIVE` |

### Down Score

| Condition | Points | Reason Code |
|---|---:|---|
| `price_vs_ma20_pct < 0` | 1 | `PRICE_BELOW_MA20` |
| `ma5_vs_ma20_pct < 0` | 1 | `MA5_BELOW_MA20` |
| `weekly_return < 0` | 1 | `WEEKLY_RETURN_NEGATIVE` |
| `daily_return < 0` | 1 | `DAILY_RETURN_NEGATIVE` |

### Sideways Score

| Condition | Points | Reason Code |
|---|---:|---|
| `abs(price_vs_ma20_pct) < 0.5` | 1 | `PRICE_NEAR_MA20` |
| `abs(ma5_vs_ma20_pct) < 0.5` | 1 | `MA5_NEAR_MA20` |
| `abs(weekly_return) < 3.0` | 1 | `WEEKLY_RETURN_NEUTRAL` |

---

## Final Direction Rules

Apply after invalid, insufficient, and caution rules.

```text
if up_score >= 3 and up_score > down_score and up_score > sideways_score:
  market_status = up

else if down_score >= 3 and down_score > up_score and down_score > sideways_score:
  market_status = down

else if sideways_score >= 2:
  market_status = sideways

else if abs(up_score - down_score) <= 1:
  market_status = sideways

else:
  market_status = sideways
```

Do not return `up` or `down` with fewer than 3 matching directional conditions.

---

## Trend Strength

| Condition | trend_strength |
|---|---|
| `market_status` is `invalid_data` or `insufficient_data` | `unknown` |
| `market_status` is `caution` and no direction score is selected | `unknown` |
| selected directional score is `4` | `high` |
| selected directional score is `3` | `medium` |
| selected directional score is `2` or less | `low` |

For `sideways`, use:

| Condition | trend_strength |
|---|---|
| `sideways_score >= 2` | `medium` |
| `sideways_score < 2` | `low` |

---

## Reason Code Order

Emit reason codes in this order:

1. price vs 20-period average reason
2. 5-period vs 20-period average reason
3. 7-period return reason
4. one-period return reason
5. volatility reason
6. volume reason
7. invalid or insufficient reason

Use only reason codes supported by the metrics that are present.

---

## Output Evidence Requirements

For every status:

| Status | Required Evidence |
|---|---|
| `up` | at least 3 up reason codes |
| `down` | at least 3 down reason codes |
| `sideways` | at least 2 sideways reason codes or score difference rule |
| `caution` | at least 1 risk reason |
| `insufficient_data` | missing metrics list |
| `invalid_data` | invalid reason |

