# Data Quality Criteria

## Purpose

This document defines concrete data quality rules for investment data.

Use it before metric calculation, signal interpretation, visualization, or summary generation.

---

## Universal Data Quality Checks

Apply these checks to every investment dataset.

| Check | Valid Condition | Warning Condition | Invalid Condition |
|---|---|---|---|
| input structure | Data is an object, array, table, or document with identifiable fields. | Data shape is readable but field names are inconsistent. | Data cannot be parsed or inspected. |
| source | Source is known or explicitly user-provided. | Source is missing but values are otherwise usable. | Source claims conflict with data content in a way that blocks interpretation. |
| reference time | Date, timestamp, period, or reporting interval is present. | Some records have missing reference time. | Required time reference is absent for time-dependent analysis. |
| numeric fields | Numeric fields are numbers. | Numeric strings exist but are not used for calculation unless explicitly normalized. | Required numeric field is non-numeric, `NaN`, infinite, or structurally invalid. |
| unit/currency | Unit or currency is known where needed. | Unit is missing for secondary fields. | Unit/currency is required for interpretation and cannot be inferred. |
| missing values | Missing values are explicit and preserved. | Secondary fields contain nulls. | Required fields are missing. |
| duplicate records | Duplicates are absent or have a deterministic key. | Duplicate non-critical records exist. | Duplicate records affect required calculations and cannot be resolved deterministically. |
| calculated values | Calculated fields are marked or separable from raw fields. | Mixed raw/calculated fields are present but not used in core interpretation. | Calculated values are mixed with raw values in a way that changes the result. |

---

## Missing Value Rules

Use these exact rules:

- Required field missing in 1 or more records used for a required calculation -> `invalid_data` for that calculation.
- Secondary field missing -> keep the dataset usable and record a warning.
- Missing numeric values must not be replaced with `0`.
- Missing dates must not be guessed.
- Missing currency must not be inferred from locale.
- Missing benchmark must be recorded as a limitation.

---

## Invalid Value Rules

Treat these values as invalid:

- `NaN`
- `Infinity`
- `-Infinity`
- empty string in a required numeric field
- string in a required numeric field unless a separate normalization rule explicitly allows conversion
- negative value for a field that cannot be negative by definition, such as share count, asset count, or total market value
- zero denominator in ratio calculations

Do not silently coerce invalid values.

---

## Outlier Rules

Outliers are not always invalid. Mark them separately.

| Data Type | Outlier Condition | Default Treatment |
|---|---|---|
| price series | one-period return absolute value >= 20% | warning unless asset type allows high volatility |
| portfolio holdings | single asset weight >= 30% | concentration caution |
| financial statement | period-over-period change absolute value >= 50% | warning and require context |
| macro indicator | period-over-period change exceeds 3 times the recent median absolute change | warning |
| text signal | one source dominates more than 70% of signal count | source concentration warning |

If an outlier triggers a warning, the original value must remain unchanged.

---

## Data Category Minimum Requirements

### Price Time Series

Minimum fields:

- reference time: required
- price basis: required

Valid price basis examples:

- close
- adjusted close
- net asset value
- index level

Minimum data count:

| Analysis | Minimum Points |
|---|---:|
| latest value | 1 |
| one-period change | 2 |
| 5-period average | 5 |
| 20-period average | 20 |
| 20-return volatility | 21 |

### Portfolio Holdings

Minimum fields:

- asset identifier or asset name
- quantity or market value
- valuation date
- currency if market value is used

Portfolio-level analysis is valid only when:

- total market value is greater than `0`
- at least 1 holding has valid value
- every included holding has non-negative value

### Financial Statements

Minimum fields:

- reporting period
- statement type or metric category
- at least one numeric financial metric

Period comparison requires:

- current period value
- prior comparable period value
- same unit/currency

### Volume and Fund Flow

Minimum fields:

- reference time or period
- flow, volume, inflow, outflow, or net flow value
- unit

Net flow calculation requires:

- inflow and outflow values
- both values use the same unit and period

### Macroeconomic Indicators

Minimum fields:

- indicator name
- reference period
- numeric value
- unit

Trend analysis requires:

- at least 2 comparable periods

### News or Text Signals

Minimum fields:

- text content or summarized signal
- source or source type
- publication time or reporting time

Text signal analysis must include:

- source count
- positive/negative/neutral evidence count if sentiment is used
- uncertainty or risk keyword count if risk is discussed

