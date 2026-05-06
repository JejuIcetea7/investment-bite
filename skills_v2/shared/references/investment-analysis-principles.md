# Investment Analysis Principles

## Purpose

This document defines shared analysis principles for investment data.

These principles apply across investment-related data types, including:

- price time series
- portfolio holdings
- portfolio transactions
- financial statements
- valuation metrics
- volume and fund flow data
- macroeconomic indicators
- news, disclosure, and text-based signals

This document is not a specification for one program or one dashboard. It is a reusable analysis standard that Codex should consult before validating, calculating, interpreting, visualizing, or summarizing investment data.

---

## Core Rule

Investment data must be analyzed in this order:

```text
data quality check
-> metric calculation
-> signal interpretation
-> visualization guidance
-> user-facing summary
```

Do not interpret before checking whether the data is usable.
Do not summarize a signal before identifying the calculation basis.
Do not present a visualization without checking whether the data shape supports that visualization.

---

## Common Analysis Requirements

Every investment data analysis must identify these items before interpretation:

| Item | Required Standard |
|---|---|
| data category | Identify the data type, such as price series, portfolio, financial statement, macro indicator, or text signal. |
| source | Record whether the source is known, unknown, or user-provided without verification. |
| reference time | Identify the date, timestamp, period, or reporting interval used by the data. |
| unit | Identify the unit for numeric values, such as KRW, USD, shares, contracts, percent, basis points, or index points. |
| raw vs calculated | Separate source-provided values from calculated values. |
| missing values | Preserve missing values as `null` or explicit missing markers. Do not infer missing values. |
| invalid values | Mark values that violate the field meaning, such as negative share counts or non-numeric numeric fields. |
| calculable metrics | List which metrics can be calculated from the available data. |
| unavailable metrics | List which metrics cannot be calculated and why. |
| limitations | State concrete limitations, such as insufficient history, missing currency, missing benchmark, or incomplete holdings. |

---

## Common Status Values

Use these common signal values for broad investment data interpretation:

| Status | Meaning |
|---|---|
| `positive` | The available evidence supports a favorable reading for the analyzed subject. |
| `negative` | The available evidence supports an unfavorable reading for the analyzed subject. |
| `neutral` | The available evidence does not support a clearly positive or negative reading. |
| `caution` | At least one explicit risk or instability condition is triggered. |
| `insufficient_data` | Required data for interpretation is missing. |
| `invalid_data` | The data structure or values are invalid enough that interpretation should not proceed. |

Use domain-specific labels only as a mapped explanation.

Examples:

| Data Type | `positive` | `negative` | `neutral` | `caution` |
|---|---|---|---|---|
| price series | 상승 흐름 | 하락 흐름 | 횡보 | 급락, 고변동성, 큰 이탈 |
| portfolio | 분산 양호 또는 성과 양호 | 손실 확대 | 변화 제한 | 특정 자산 집중 |
| financial statement | 성장성/수익성 개선 | 수익성 악화 | 큰 변화 없음 | 부채 급증, 적자 확대 |
| macro indicator | 환경 개선 | 환경 악화 | 중립 | 급격한 변동 |
| text signal | 긍정 신호 우세 | 부정 신호 우세 | 혼재 | 불확실성 또는 위험 언급 집중 |

---

## Exactness Rule

Avoid vague interpretation language in analysis criteria.

Do not use these expressions as criteria:

- 다수 만족
- 대부분 성공
- 대체로 양호
- 강한 위험 신호
- 의미 있는 변화
- 지나치게 높음
- 애매하면
- 충분하지 않으면
- 크게 증가
- 많이 하락

Replace them with exact conditions:

| Vague Expression | Required Replacement Pattern |
|---|---|
| 다수 만족 | 조건 `N`개 중 `M`개 이상 충족 |
| 대부분 성공 | 필수 지표 `N`개 중 `M`개 이상 계산 가능 |
| 강한 위험 신호 | 위험 조건 1개 이상 충족 또는 지정된 위험 점수 이상 |
| 의미 있는 변화 | 기준값 대비 `X%` 이상 변화 |
| 지나치게 높음 | 기준 임계값 이상 |
| 애매하면 | 최고 점수 차이 `1` 이하이면 `neutral` |
| 데이터 부족 | 필수 항목 목록 중 누락 항목 수 명시 |

---

## Evidence Rule

Every interpretation must include evidence.

Minimum evidence structure:

```json
{
  "signal": "caution",
  "reason_codes": ["HIGH_VOLATILITY"],
  "risk_reasons": ["HIGH_VOLATILITY"],
  "available_metrics": ["daily_return", "volatility_20d"],
  "missing_metrics": ["monthly_return"],
  "limitations": ["Only 21 price records are available."]
}
```

Do not output a positive, negative, neutral, or caution interpretation without at least one reason code.

Exceptions:

- `insufficient_data` may use `INSUFFICIENT_REQUIRED_FIELDS`.
- `invalid_data` may use `INVALID_INPUT_STRUCTURE` or a field-level invalid reason.

---

## Confidence Levels

Use these confidence values:

| Confidence | Required Condition |
|---|---|
| `high` | Required fields are present, required calculations are available, and no critical data quality warning exists. |
| `medium` | Required fields are present, at least one secondary metric is missing, and interpretation still has at least two evidence points. |
| `low` | Interpretation depends on one evidence point, important metadata is missing, or data quality warnings affect interpretation. |
| `unknown` | Data is invalid or too insufficient for interpretation. |

Do not use confidence as a feeling. It must follow the data availability and evidence count.

---

## Safety Rule

Investment analysis must not become investment advice.

Do not use:

- "매수해야 합니다"
- "매도해야 합니다"
- "보유하세요"
- "반드시 상승합니다"
- "곧 하락합니다"
- "수익이 보장됩니다"

Use:

- "상승 흐름으로 해석됩니다"
- "주의가 필요한 조건이 확인됩니다"
- "현재 데이터만으로는 판단이 제한됩니다"
- "이 결과는 투자 판단의 참고 정보입니다"

---

## Data Type Coverage

Use shared principles first, then apply data-type criteria:

| Data Type | Reference Criteria |
|---|---|
| price time series | price fields, returns, moving averages, volatility, volume changes |
| portfolio holdings | weights, concentration, asset count, currency, valuation basis |
| financial statements | growth, margins, leverage, profitability, cash flow |
| volume/fund flow | volume change, net flow, participation, abnormal flow |
| macro indicators | period-over-period change, threshold zones, direction change |
| news/text signal | sentiment, uncertainty, risk terms, source credibility |

If the data type cannot be identified, classify it as `unknown` and do not force price-series logic.

