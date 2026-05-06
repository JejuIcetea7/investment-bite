# Safety Expression Rules

## Purpose

This document defines safe language rules for investment data analysis.

Use it when writing summaries, insights, explanations, labels, warnings, or beginner notes.

---

## Prohibited Expressions

Do not use expressions that sound like direct investment advice:

- 매수해야 합니다
- 매도해야 합니다
- 보유하세요
- 지금 사야 합니다
- 지금 팔아야 합니다
- 반드시 상승합니다
- 반드시 하락합니다
- 수익이 보장됩니다
- 손실이 없습니다
- 안전한 투자입니다
- 확실한 기회입니다

Do not claim future certainty:

- 곧 오릅니다
- 곧 떨어집니다
- 앞으로 계속 상승합니다
- 앞으로 계속 하락합니다

---

## Allowed Expressions

Use evidence-based interpretation language:

- 상승 흐름으로 해석됩니다
- 하락 압력이 확인됩니다
- 방향성이 뚜렷하지 않습니다
- 주의가 필요한 조건이 확인됩니다
- 현재 데이터만으로는 판단이 제한됩니다
- 이 결과는 투자 판단의 참고 정보입니다
- 추가 데이터 확인이 필요합니다

---

## Summary Structure

User-facing summaries should follow this order:

```text
1. status
2. evidence
3. limitation or caution
```

Examples:

```text
현재 가격 흐름은 상승으로 해석됩니다. 가격이 20일 평균 위에 있고 주간 수익률도 양수입니다. 다만 이 결과는 최근 가격 데이터 기준입니다.
```

```text
현재 데이터만으로는 재무 상태를 안정적으로 해석하기 어렵습니다. 전기 비교에 필요한 이전 기간 값이 없습니다.
```

---

## Evidence Count Rule

Use no more than 3 evidence points in a short summary.

Use no more than 5 evidence points in a detailed explanation.

If there are more than 5 evidence points, group them by theme:

- price
- profitability
- risk
- portfolio concentration
- data quality

---

## Missing Data Rule

Do not mention missing metrics as if they were calculated.

Use:

- "월간 수익률은 데이터 기간이 부족해 계산하지 않습니다."
- "이동평균 해석은 20개 이상의 가격 기록이 필요합니다."
- "통화 정보가 없어 포트폴리오 총액 비교는 제한됩니다."

Do not use:

- "월간 수익률은 낮습니다" when monthly return is missing.
- "포트폴리오가 작습니다" when currency or total value is missing.

---

## Caution Rule

If `signal = caution` or `risk_reasons` is not empty, the summary must include a caution sentence.

The caution sentence must identify the triggering reason.

Example:

```text
단일 자산 비중이 30% 이상이라 포트폴리오 집중도에 주의가 필요합니다.
```

Do not write:

```text
주의가 필요합니다.
```

without the reason.

