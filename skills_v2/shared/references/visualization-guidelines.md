# Visualization Guidelines

## Purpose

This document defines visualization standards for investment data analysis.

It is not tied to a specific UI framework. Use it to decide which visual representation best communicates a validated investment analysis result.

---

## Visualization Selection Rule

Choose visualization by data shape and analytical question.

| Data Shape | Analytical Question | Recommended Visualization |
|---|---|---|
| time series | How did a value change over time? | line chart |
| time series with reference line | How does a value compare with an average or benchmark? | line chart with overlay |
| category values | Which category is larger? | bar chart |
| portfolio weights | What is the composition? | donut chart or stacked bar |
| period comparison | How did metrics change across periods? | grouped bar chart |
| risk flags | What needs attention? | badge, alert area, or highlighted row |
| data quality | Can this data be trusted? | status label and short limitation note |
| missing data | Why is no result shown? | empty state explanation |
| text signal | What themes or sentiment dominate? | evidence count table or categorized list |

Do not use a chart when a status label or table communicates the result more accurately.

---

## Required Visualization Metadata

Every visualization recommendation must include:

- purpose
- data fields used
- required data availability
- display format
- empty-state condition
- caution or limitation note when applicable

Example:

```json
{
  "visual_type": "line_chart",
  "purpose": "show price movement over time",
  "required_fields": ["date", "price"],
  "optional_fields": ["moving_average_5", "moving_average_20"],
  "empty_state": "Show data 부족 message when fewer than 2 time points exist.",
  "limitations": ["Moving average lines require enough history."]
}
```

---

## Data-Type Visualization Criteria

### Price Time Series

| Analysis Result | Visualization |
|---|---|
| latest price only | KPI value |
| price trend with 2 or more points | line chart |
| moving average comparison | line chart overlay |
| period returns | KPI cards or bar chart |
| volatility | KPI card with caution badge if threshold is met |
| volume change | bar chart or KPI card |
| data error | error state with invalid reason |
| insufficient history | empty or partial state with missing metric list |

Rules:

- Use line charts only when at least 2 time points exist.
- Use moving average overlays only when the relevant average is calculable.
- Do not show a moving-average chart if the average is `null`.
- Show risk badge when `signal = caution` or `risk_reasons` is not empty.

### Portfolio Holdings

| Analysis Result | Visualization |
|---|---|
| holding weights | donut chart or stacked bar |
| top holdings | ranked table |
| concentration risk | warning badge or highlighted top holding |
| asset class allocation | stacked bar or grouped bar |
| currency exposure | grouped bar |
| missing valuation | data quality label |

Rules:

- Use a donut chart only when total market value is greater than `0`.
- Show top holdings table when holding count is greater than `10`.
- Show concentration warning when single asset weight is at least `30%`.
- Show concentration warning when top 3 weight is at least `60%`.

### Financial Statements

| Analysis Result | Visualization |
|---|---|
| revenue by period | bar chart |
| margin trend | line chart |
| profit/loss comparison | grouped bar chart |
| debt ratio | KPI card or line chart |
| cash flow | bar chart |
| caution signal | warning badge with reason |

Rules:

- Use period charts only when at least 2 comparable periods exist.
- Use grouped bars when comparing revenue, operating income, and net income.
- Use line charts for ratio trends.
- Mark negative profit or negative cash flow visually as unfavorable.

### Volume and Fund Flow

| Analysis Result | Visualization |
|---|---|
| volume trend | bar chart |
| inflow/outflow comparison | grouped bar chart |
| net flow | line chart or bar chart |
| abnormal flow | highlighted bar or caution badge |

Rules:

- Use bar charts for discrete period values.
- Show caution if net outflow worsens by at least `30%` from the prior period.

### Macroeconomic Indicators

| Analysis Result | Visualization |
|---|---|
| indicator trend | line chart |
| threshold zones | line chart with reference band |
| period change | bar chart |
| latest reading | KPI card |

Rules:

- Always display unit.
- Show reference bands only when threshold values are explicitly defined.
- Do not infer favorable or unfavorable direction without an indicator-specific rule.

### News or Text Signals

| Analysis Result | Visualization |
|---|---|
| sentiment counts | bar chart or count table |
| risk themes | categorized list |
| source distribution | table or bar chart |
| uncertainty level | badge |

Rules:

- Do not visualize text sentiment as a precise numeric score unless the scoring method is documented.
- Show source count when summarizing text signals.
- Show source concentration warning when one source is more than `70%` of all signals.

---

## Status Visual Mapping

Use semantic visual roles instead of fixed color hex values.

| Signal | Visual Role |
|---|---|
| `positive` | favorable |
| `negative` | unfavorable |
| `neutral` | neutral |
| `caution` | warning |
| `insufficient_data` | muted |
| `invalid_data` | error |

Price-series label mapping:

| Price Status | Common Signal | Visual Role |
|---|---|---|
| `up` | `positive` | favorable |
| `down` | `negative` | unfavorable |
| `sideways` | `neutral` | neutral |
| `caution` | `caution` | warning |
| `insufficient_data` | `insufficient_data` | muted |
| `invalid_data` | `invalid_data` | error |

---

## Empty and Error States

Use exact empty/error state rules:

| Condition | Display |
|---|---|
| input cannot be parsed | error state with invalid-data reason |
| required fields missing | error state listing missing fields |
| valid but insufficient history | empty state listing unavailable metrics |
| optional metric unavailable | hide that metric and show limitation note |
| risk signal exists | show warning badge and reason |

