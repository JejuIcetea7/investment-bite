# Reason Codes

## Purpose

This document defines standard reason codes for investment data analysis.

Use reason codes to connect:

- metric calculation
- signal interpretation
- visualization emphasis
- user-facing summary

Every positive, negative, neutral, caution, insufficient, or invalid interpretation must include at least one reason code.

---

## Common Reason Codes

| Code | Use When | Explanation Point |
|---|---|---|
| `SOURCE_MISSING` | source is missing | 데이터 출처가 명확하지 않습니다. |
| `REFERENCE_TIME_MISSING` | date, timestamp, or period is missing | 기준 시점 정보가 부족합니다. |
| `UNIT_MISSING` | unit or currency is required but missing | 단위 또는 통화 정보가 부족합니다. |
| `INSUFFICIENT_DATA` | structurally valid data lacks enough evidence | 분석에 필요한 데이터가 부족합니다. |
| `INVALID_INPUT_STRUCTURE` | input shape cannot be inspected | 입력 데이터 구조가 올바르지 않습니다. |
| `INVALID_NUMERIC_VALUE` | required numeric value is invalid | 필수 숫자 값이 유효하지 않습니다. |
| `MISSING_REQUIRED_FIELD` | required field is missing | 필수 항목이 누락되었습니다. |

---

## Price-Series Reason Codes

| Code | Condition | Explanation Point |
|---|---|---|
| `PRICE_ABOVE_MA20` | `price_vs_ma20_pct > 0` | 현재 가격이 20기간 평균 위에 있습니다. |
| `PRICE_BELOW_MA20` | `price_vs_ma20_pct < 0` | 현재 가격이 20기간 평균 아래에 있습니다. |
| `PRICE_NEAR_MA20` | `abs(price_vs_ma20_pct) < 0.5` | 현재 가격이 20기간 평균 부근에 있습니다. |
| `MA5_ABOVE_MA20` | `ma5_vs_ma20_pct > 0` | 5기간 평균이 20기간 평균보다 높습니다. |
| `MA5_BELOW_MA20` | `ma5_vs_ma20_pct < 0` | 5기간 평균이 20기간 평균보다 낮습니다. |
| `MA5_NEAR_MA20` | `abs(ma5_vs_ma20_pct) < 0.5` | 5기간 평균과 20기간 평균의 차이가 작습니다. |
| `WEEKLY_RETURN_POSITIVE` | `weekly_return > 0` | 7기간 수익률이 양수입니다. |
| `WEEKLY_RETURN_NEGATIVE` | `weekly_return < 0` | 7기간 수익률이 음수입니다. |
| `WEEKLY_RETURN_NEUTRAL` | `abs(weekly_return) < 3.0` | 7기간 수익률 변화 폭이 3% 미만입니다. |
| `DAILY_RETURN_POSITIVE` | `daily_return > 0` | 최근 1기간 수익률이 양수입니다. |
| `DAILY_RETURN_NEGATIVE` | `daily_return < 0` | 최근 1기간 수익률이 음수입니다. |
| `HIGH_VOLATILITY` | `volatility_20d >= 25` | 변동성이 기준치 이상입니다. |
| `SHARP_DAILY_DROP` | `daily_return <= -3.0` | 최근 1기간 낙폭이 -3% 이하입니다. |
| `SHARP_WEEKLY_DROP` | `weekly_return <= -7.0` | 최근 7기간 낙폭이 -7% 이하입니다. |
| `PRICE_WELL_BELOW_MA20` | `price_vs_ma20_pct <= -5.0` | 현재 가격이 20기간 평균보다 5% 이상 낮습니다. |
| `VOLUME_SPIKE_WITH_PRICE_SWING` | `volume_change_rate >= 50` and `abs(daily_return) >= 2.0` | 거래량 급증과 큰 가격 변동이 함께 나타났습니다. |

---

## Portfolio Reason Codes

| Code | Condition | Explanation Point |
|---|---|---|
| `SINGLE_ASSET_CONCENTRATION` | largest holding weight `>= 30%` | 단일 자산 비중이 30% 이상입니다. |
| `TOP3_ASSET_CONCENTRATION` | top 3 holding weight `>= 60%` | 상위 3개 자산 비중이 60% 이상입니다. |
| `DIVERSIFIED_HOLDINGS` | largest holding weight `< 30%`, top 3 weight `< 60%`, holding count `>= 5` | 보유 자산이 한쪽에 과도하게 집중되어 있지 않습니다. |
| `NEGATIVE_HOLDING_VALUE` | any holding value `< 0` | 평가금액이 음수인 자산이 있습니다. |
| `CURRENCY_MISSING` | currency is required but missing | 통화 정보가 부족합니다. |

---

## Financial Statement Reason Codes

| Code | Condition | Explanation Point |
|---|---|---|
| `REVENUE_GROWTH_POSITIVE` | revenue growth `> 0%` | 매출이 전기 대비 증가했습니다. |
| `REVENUE_GROWTH_NEGATIVE` | revenue growth `< 0%` | 매출이 전기 대비 감소했습니다. |
| `REVENUE_DROP_CAUTION` | revenue growth `<= -10%` | 매출 감소 폭이 -10% 이하입니다. |
| `OPERATING_MARGIN_POSITIVE` | operating margin `> 0%` | 영업이익률이 양수입니다. |
| `OPERATING_MARGIN_NEGATIVE` | operating margin `< 0%` | 영업이익률이 음수입니다. |
| `OPERATING_MARGIN_DROP_CAUTION` | operating margin drops by `5` percentage points or more | 영업이익률이 전기 대비 5%p 이상 하락했습니다. |
| `DEBT_RATIO_INCREASE_CAUTION` | debt ratio increases by `20` percentage points or more | 부채비율이 전기 대비 20%p 이상 상승했습니다. |
| `NEGATIVE_OPERATING_CASH_FLOW` | operating cash flow `< 0` | 영업현금흐름이 음수입니다. |

---

## Text Signal Reason Codes

| Code | Condition | Explanation Point |
|---|---|---|
| `POSITIVE_TEXT_EVIDENCE` | positive evidence count `>= 2` and greater than negative count | 긍정 근거가 부정 근거보다 많습니다. |
| `NEGATIVE_TEXT_EVIDENCE` | negative evidence count `>= 2` and greater than positive count | 부정 근거가 긍정 근거보다 많습니다. |
| `RISK_TEXT_EVIDENCE` | risk evidence count `>= 2` and at least positive count | 위험 또는 불확실성 근거가 확인됩니다. |
| `SOURCE_CONCENTRATION` | one source accounts for more than `70%` of text signals | 특정 출처에 신호가 집중되어 있습니다. |

