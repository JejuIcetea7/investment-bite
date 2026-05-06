---
name: detect-market-status
description: 계산된 가격 시계열 지표를 바탕으로 현재 가격 상태를 상승, 하락, 횡보, 주의, 데이터 부족, 데이터 오류 중 하나로 판정하고 판정 근거와 위험 신호를 구조화하여 반환하는 스킬
---

# detect-market-status

## 목적

이 스킬은 `calculate-core-metrics`에서 계산된 가격 시계열 지표를 바탕으로 현재 가격 상태를 판정하는 역할을 한다.

이 스킬은 모든 투자 데이터의 신호 해석 기준이 아니다. 공통 투자 데이터 신호 기준은 `shared/references/signal-status-rules.md`를 따르고, 이 문서는 가격 시계열 데이터의 구체 판정 기준을 정의한다.

이 스킬의 목적은 다음과 같다.

- 계산된 숫자 지표를 사람이 이해할 수 있는 상태값으로 변환한다.
- 현재 상태를 `상승`, `하락`, `횡보`, `주의` 중 하나로 단순화한다.
- 위험 신호가 있는지 함께 판정한다.
- 판정 근거를 구조적으로 반환한다.
- 후속 `generate-insight-summary`가 바로 사용할 수 있는 상태 정보를 제공한다.

이 스킬은 **상태를 판정하는 역할**을 한다.  
이 스킬은 직접 수치를 계산하지 않는다.  
이 스킬은 최종 투자 추천이나 매수/매도 조언도 하지 않는다.

---

## 사용할 때

다음 상황에서 이 스킬을 사용한다.

- `calculate-core-metrics`가 완료된 뒤
- 대시보드에 현재 시장 상태를 보여줘야 할 때
- 상승 / 하락 / 횡보 / 주의 상태를 결정해야 할 때
- 위험 신호 여부를 사용자에게 표시해야 할 때
- 최종 요약 문장을 만들기 전에 상태 라벨이 필요할 때

즉, 이 스킬은 **계산 이후, 설명 생성 이전** 단계에서 사용한다.

---

## 사용하지 않아도 되는 경우

다음 조건을 모두 만족하면 생략할 수 있다.

- 상태값이 이미 신뢰 가능한 외부 로직에서 계산되어 있다.
- 대시보드가 수치만 보여주고 해석 상태를 사용하지 않는다.
- 상태 라벨 없이 원시 지표만 표시하면 충분하다.

단, 본 프로젝트에서는 초보자 친화적 해석이 중요하므로 이 스킬을 사용하는 것을 권장한다.

---

## 입력 데이터

이 스킬은 기본적으로 `calculate-core-metrics`의 출력을 입력으로 받는다.

권장 입력 구조는 다음과 같다.

```json
{
  "status": "success",
  "summary": "Core market metrics calculated successfully.",
  "metrics": {
    "current_close": 152.3,
    "daily_return": 1.24,
    "weekly_return": 3.82,
    "monthly_return": null,
    "cumulative_return": 8.15,
    "ma5": 149.8,
    "ma20": 145.2,
    "ma60": null,
    "volatility_20d": 12.4,
    "volume_change_rate": -8.2,
    "price_vs_ma20_pct": 4.89,
    "ma5_vs_ma20_pct": 3.17
  },
  "available_metrics": [
    "current_close",
    "daily_return",
    "weekly_return",
    "cumulative_return",
    "ma5",
    "ma20",
    "volatility_20d",
    "volume_change_rate",
    "price_vs_ma20_pct",
    "ma5_vs_ma20_pct"
  ],
  "missing_metrics": [
    "monthly_return",
    "ma60"
  ],
  "meta": {
    "record_count": 30,
    "latest_date": "2026-05-03",
    "used_price_field": "close",
    "used_volume_field": "volume"
  }
}
```

---

## 필수 입력 조건

아래 조건을 만족해야 한다.

- `status`가 `success` 또는 `partial_success`여야 한다.
- `metrics` 객체가 존재해야 한다.
- 최소한 아래 값 중 일부가 있어야 한다.
  - `daily_return`
  - `weekly_return`
  - `ma5`
  - `ma20`
  - `volatility_20d`

`weekly_return`, `price_vs_ma20_pct`, `volatility_20d` 중 2개 이상이 없으면 `insufficient_data`로 처리한다.

---

## 참고 문서

이 스킬은 다음 문서를 참고해야 한다.

- `shared/references/glossary.md`
- `shared/references/thresholds.md`
- `shared/references/reason-codes.md`

원칙은 다음과 같다.

- 용어의 의미는 `glossary.md`를 따른다.
- 구체적인 가격 시계열 상태 판정 기준은 `thresholds.md`를 따른다.
- 판정 근거 코드는 `reason-codes.md`를 따른다.
- 이 문서는 실제 판정 절차와 입출력 구조를 정의한다.

---

## 상태 판정 목표

이 스킬은 최종적으로 아래 중 하나의 `market_status`를 반환한다.

- `up`
- `down`
- `sideways`
- `caution`
- `insufficient_data`
- `invalid_data`

설명:

- `up`: 전반적으로 상승 흐름
- `down`: 전반적으로 하락 흐름
- `sideways`: 방향성이 뚜렷하지 않음
- `caution`: 위험 신호가 강해 주의가 필요함
- `insufficient_data`: 상태 판정에 필요한 데이터가 부족함
- `invalid_data`: 입력 구조 또는 계산 결과가 유효하지 않음

---

## 핵심 판정 원칙

### 1. 계산과 해석 분리

- 이 스킬은 입력된 계산값을 사용해 상태를 판정한다.
- 계산이 필요한 경우에도 새로 계산하지 않는다.
- 입력된 `metrics`만 사용한다.

---

### 2. 위험 신호 우선

- 위험 신호가 강하면 추세보다 `주의(caution)`를 우선할 수 있다.
- 예를 들어 상승 조건을 만족하더라도 변동성이 매우 높거나 급락이 있으면 최종 상태는 `caution`이 될 수 있다.

---

### 3. 단순하고 설명 가능한 상태 사용

- 초보자도 이해할 수 있는 상태값을 우선한다.
- 너무 많은 세부 상태를 만들지 않는다.
- 최종 메인 상태는 `상승 / 하락 / 횡보 / 주의` 중심으로 단순화한다.

---

### 4. 근거 기반 판정

- 각 최종 상태에는 반드시 판정 근거를 함께 기록한다.
- `reason_codes`와 `reason_text`를 함께 반환한다.
- 추측성 문구는 사용하지 않는다.

---

## 사용 지표

이 스킬은 아래 지표를 우선 사용한다.

### 핵심 지표
- `daily_return`
- `weekly_return`
- `ma5`
- `ma20`
- `volatility_20d`
- `price_vs_ma20_pct`
- `ma5_vs_ma20_pct`

### 보조 지표
- `monthly_return`
- `cumulative_return`
- `volume_change_rate`

### 메타 정보
- `record_count`
- `latest_date`

---

## 상태 판정에 사용하는 기준

이 스킬은 기본적으로 `thresholds.md`의 기준을 사용한다.  
아래는 구현 시 직접 참고할 핵심 기준이다.

---

## 1. 데이터 부족 판정

다음 조건이면 `insufficient_data`로 처리한다.

- `weekly_return`, `price_vs_ma20_pct`, `volatility_20d` 중 2개 이상이 `null`
- `daily_return`만 존재하고 다른 방향성 근거가 없음
- 상승, 하락, 횡보 점수를 모두 계산할 수 없음

주의:

- `daily_return` 하나만 있다고 상태를 단정하지 않는다.

---

## 2. 데이터 오류 판정

다음 조건 중 하나면 `invalid_data`로 처리한다.

- `status = failed`
- `metrics` 구조가 없음
- 핵심 값이 숫자가 아님
- 계산값이 비정상적으로 깨져 있음
- 필수 값이 모두 누락됨

예:
- `daily_return = "abc"`
- `ma20 = null`, `weekly_return = "NaN"` 등 구조적으로 심각한 경우

---

## 3. 상승 후보 판정

아래 상승 점수를 계산한다.

핵심 조건:

- `price_vs_ma20_pct > 0`
- `ma5_vs_ma20_pct > 0`
- `weekly_return > 0`

보강 조건:

- `daily_return > 0`
- `volatility_20d`가 과도하게 높지 않음

상승 점수 3점 이상 해석 예:

- 현재 가격이 20일 평균 위
- 5일 평균도 20일 평균 위
- 주간 수익률 양수
- 변동성이 보통 이하

---

## 4. 하락 후보 판정

아래 하락 점수를 계산한다.

핵심 조건:

- `price_vs_ma20_pct < 0`
- `ma5_vs_ma20_pct < 0`
- `weekly_return < 0`

보강 조건:

- `daily_return < 0`
- 변동성이 보통 이하 또는 하락 방향이 명확함

하락 점수 3점 이상 해석 예:

- 현재 가격이 20일 평균 아래
- 5일 평균도 20일 평균 아래
- 주간 수익률 음수

---

## 5. 횡보 후보 판정

아래 횡보 점수를 계산한다.

핵심 조건:

- `abs(price_vs_ma20_pct) < 0.5`
- `abs(ma5_vs_ma20_pct) < 0.5`
- `abs(weekly_return) < 3.0`

보강 조건:

- `volatility_20d`가 매우 높지 않음
- 상승/하락 조건이 동시에 약함

설명:

- 가격이 평균 부근에서 움직이고 있고
- 단기 평균과 중기 평균 차이도 작고
- 주간 수익률도 크지 않으면
→ 방향성이 약한 상태로 본다.

---

## 6. 주의 후보 판정

다음 조건 중 하나라도 만족하면 `caution`으로 판정한다.

### 급락 위험
- `daily_return <= -3.0`
- 또는 `weekly_return <= -7.0`

### 고변동성 위험
- `volatility_20d >= 25`

### 평균선 대비 큰 하락 이탈
- `price_vs_ma20_pct <= -5.0`

### 거래량 급증 + 큰 가격 변동
- `volume_change_rate >= 50`
- 그리고 `abs(daily_return) >= 2.0`

### 입력 값은 상승처럼 보여도 불안정성이 과도한 경우
- 예: `weekly_return > 0` 이지만 `volatility_20d >= 25`

이 경우 최종 상태는 `up` 대신 `caution`이 될 수 있다.

---

## 판정 절차

이 스킬은 아래 순서대로 판정한다.

### 1단계. 입력 유효성 확인

확인 항목:

- `status`
- `metrics` 존재 여부
- 핵심 지표 값 존재 여부
- 숫자 타입 여부

판정:

- 유효하지 않으면 `invalid_data`

---

### 2단계. 데이터 부족 여부 확인

확인 항목:

- 핵심 지표 개수
- `ma20` 존재 여부
- `weekly_return` 존재 여부
- `volatility_20d` 존재 여부

판정:

- 상태 판정이 어려우면 `insufficient_data`

---

### 3단계. 위험 신호 확인

확인 항목:

- 급락 여부
- 변동성 과다 여부
- 평균선 대비 과도한 하락 이탈 여부
- 거래량 급증 + 급변 여부

판정:

- 위험 조건이 1개 이상 있으면 최종 상태를 `caution`으로 기록

---

### 4단계. 상승 / 하락 / 횡보 후보 점수화

각 상태에 대해 조건 충족 수를 계산한다.

점수 방식:

- 상승 점수: 상승 조건 만족 개수
- 하락 점수: 하락 조건 만족 개수
- 횡보 점수: 횡보 조건 만족 개수

예:
- `price_vs_ma20_pct > 0` → 상승 +1
- `ma5_vs_ma20_pct > 0` → 상승 +1
- `weekly_return > 0` → 상승 +1

---

### 5단계. 최종 상태 결정

기본 원칙:

1. `invalid_data`가 최우선
2. `insufficient_data`가 다음
3. 위험 조건이 1개 이상 있으면 `caution`
4. 그렇지 않으면 가장 점수가 높은 상태 선택
5. 동점 또는 최고 점수 차이가 `1` 이하이면 `sideways`

---

## 점수 기반 로직

아래 방식으로 점수를 계산한다.

### 상승 점수
- `price_vs_ma20_pct > 0` → +1
- `ma5_vs_ma20_pct > 0` → +1
- `weekly_return > 0` → +1
- `daily_return > 0` → +1

### 하락 점수
- `price_vs_ma20_pct < 0` → +1
- `ma5_vs_ma20_pct < 0` → +1
- `weekly_return < 0` → +1
- `daily_return < 0` → +1

### 횡보 점수
- `abs(price_vs_ma20_pct) < 0.5` → +1
- `abs(ma5_vs_ma20_pct) < 0.5` → +1
- `abs(weekly_return) < 3.0` → +1

### 주의 조건
점수 방식이 아니라 조건 우선 방식으로 처리한다.

---

## 최종 결정 규칙

다음 규칙을 적용한다.

### 규칙 1
입력 유효하지 않으면:
- `market_status = invalid_data`

### 규칙 2
핵심 지표가 부족하면:
- `market_status = insufficient_data`

### 규칙 3
위험 조건이 1개 이상이면:
- `market_status = caution`

### 규칙 4
위험 신호가 강하지 않으면:
- 상승/하락/횡보 점수 중 가장 높은 상태 선택

### 규칙 5
최고 점수 차이가 `1` 이하이면:
- `market_status = sideways`

---

## 반환 구조

이 스킬은 아래 형태의 결과를 반환하는 것을 권장한다.

```json
{
  "status": "success",
  "market_status": "up",
  "trend_strength": "medium",
  "volatility_level": "medium",
  "risk_signal": false,
  "risk_reasons": [],
  "reason_codes": [
    "PRICE_ABOVE_MA20",
    "MA5_ABOVE_MA20",
    "WEEKLY_RETURN_POSITIVE"
  ],
  "reason_text": "Current price is above the 20-day moving average, short-term average is also above the mid-term average, and weekly return is positive.",
  "supporting_metrics": {
    "daily_return": 1.24,
    "weekly_return": 3.82,
    "monthly_return": null,
    "ma5": 149.8,
    "ma20": 145.2,
    "volatility_20d": 12.4,
    "price_vs_ma20_pct": 4.89,
    "ma5_vs_ma20_pct": 3.17,
    "volume_change_rate": -8.2
  },
  "meta": {
    "latest_date": "2026-05-03",
    "record_count": 30
  }
}
```

---

## 출력 필드 설명

### `status`

스킬 실행 상태

가능한 값:

- `success`
- `partial_success`
- `failed`

원칙:

- 상태 판정이 정상 완료되면 `success`
- 일부 근거만으로 제한 판정하면 `partial_success`
- 구조 오류 등으로 실패하면 `failed`

---

### `market_status`

최종 시장 상태

가능한 값:

- `up`
- `down`
- `sideways`
- `caution`
- `insufficient_data`
- `invalid_data`

---

### `trend_strength`

추세 강도

가능한 값:

- `low`
- `medium`
- `high`
- `unknown`

판정 원칙:

- 선택된 방향 점수가 `4`이면 `high`
- 선택된 방향 점수가 `3`이면 `medium`
- 선택된 방향 점수가 `2` 이하이면 `low`
- `invalid_data` 또는 `insufficient_data`이면 `unknown`

---

### `volatility_level`

변동성 수준

가능한 값:

- `low`
- `medium`
- `high`
- `unknown`

판정 기준:

- `volatility_20d < 10` → `low`
- `10 <= volatility_20d < 25` → `medium`
- `volatility_20d >= 25` → `high`
- 값이 없으면 `unknown`

---

### `risk_signal`

위험 신호 여부

가능한 값:

- `true`
- `false`

원칙:

- `caution`이면 보통 `true`
- 다른 상태라도 보조 위험이 있으면 `true` 가능
- 위험이 없으면 `false`

---

### `risk_reasons`

위험 사유 목록

예시:

- `HIGH_VOLATILITY`
- `SHARP_DAILY_DROP`
- `SHARP_WEEKLY_DROP`
- `PRICE_WELL_BELOW_MA20`
- `VOLUME_SPIKE_WITH_PRICE_SWING`

---

### `reason_codes`

최종 상태를 만든 핵심 근거 코드 목록

예시:

- `PRICE_ABOVE_MA20`
- `MA5_ABOVE_MA20`
- `WEEKLY_RETURN_POSITIVE`
- `PRICE_NEAR_MA20`
- `HIGH_VOLATILITY`

---

### `reason_text`

최종 판정 근거를 서술형으로 설명한 텍스트

원칙:

- 짧고 명확하게 작성
- 상태를 만든 핵심 이유를 1~2문장으로 요약
- 과장 표현 금지

---

### `supporting_metrics`

최종 판정에 사용한 주요 지표 묶음

목적:

- 후속 요약 생성 스킬이 바로 사용할 수 있게 함
- 디버깅과 설명 가능성을 높임

---

### `meta`

부가 정보

포함 권장 항목:

- `latest_date`
- `record_count`

---

## 이유 코드 표준

아래 코드를 우선 사용한다.

### 상승 관련
- `PRICE_ABOVE_MA20`
- `MA5_ABOVE_MA20`
- `WEEKLY_RETURN_POSITIVE`
- `DAILY_RETURN_POSITIVE`

### 하락 관련
- `PRICE_BELOW_MA20`
- `MA5_BELOW_MA20`
- `WEEKLY_RETURN_NEGATIVE`
- `DAILY_RETURN_NEGATIVE`

### 횡보 관련
- `PRICE_NEAR_MA20`
- `MA5_NEAR_MA20`
- `WEEKLY_RETURN_NEUTRAL`

### 주의 관련
- `HIGH_VOLATILITY`
- `SHARP_DAILY_DROP`
- `SHARP_WEEKLY_DROP`
- `PRICE_WELL_BELOW_MA20`
- `VOLUME_SPIKE_WITH_PRICE_SWING`

### 예외 관련
- `INVALID_INPUT`
- `INSUFFICIENT_METRICS`

---

## 실행 절차

이 스킬은 아래 순서로 동작한다.

1. 입력 구조가 유효한지 검사한다.
2. 핵심 지표가 충분한지 확인한다.
3. 변동성 수준을 먼저 계산한다.
4. 위험 신호 조건을 확인한다.
5. 상승 조건 점수를 계산한다.
6. 하락 조건 점수를 계산한다.
7. 횡보 조건 점수를 계산한다.
8. 위험 신호가 강하면 `caution`을 우선 적용한다.
9. 그렇지 않으면 가장 점수가 높은 상태를 선택한다.
10. 최종 상태와 근거 코드, 설명 텍스트를 구성한다.
11. 후속 스킬이 사용하기 쉬운 구조로 반환한다.

---

## 예외 처리 규칙

### 1. 계산 결과 자체가 실패한 경우

조건:

- `status = failed`
- 또는 `metrics` 없음

처리:

- `market_status = invalid_data`
- `status = failed`

---

### 2. 일부 지표만 있는 경우

조건:

- `daily_return`만 있고 `ma20`, `weekly_return`, `volatility_20d` 없음

처리:

- 무리하게 상태 단정 금지
- `market_status = insufficient_data`

---

### 3. 상승 조건과 위험 조건이 함께 있는 경우

조건 예:

- `weekly_return > 0`
- `price_vs_ma20_pct > 0`
- 그러나 `volatility_20d >= 25`

처리:

- 최종 상태는 `caution`
- `risk_signal = true`
- 상승 가능성은 `reason_text` 보조 설명으로만 남길 수 있음

---

### 4. 상승 점수와 하락 점수 차이가 1 이하인 경우

처리:

- 방향성 불명확으로 간주
- `market_status = sideways`

---

## 금지 사항

이 스킬은 다음을 수행하지 않는다.

- 수익률 계산
- 이동평균 계산
- 변동성 계산
- 거래량 변화율 계산
- 매수 / 매도 / 보유 추천
- 종목 추천
- 뉴스 해석
- 최종 서술형 요약 문장 완성

즉, 이 스킬은 **상태 판정 전용 스킬**이다.

---

## 후속 스킬과의 연결

### `generate-insight-summary`

이 스킬은 아래 값을 전달한다.

- `market_status`
- `trend_strength`
- `volatility_level`
- `risk_signal`
- `risk_reasons`
- `reason_codes`
- `reason_text`
- `supporting_metrics`

`generate-insight-summary`는 이 정보를 바탕으로 사용자용 설명 문장을 생성한다.

---

## 예시 시나리오

### 1. 상승 상태

조건:

- `price_vs_ma20_pct = 4.89`
- `ma5_vs_ma20_pct = 3.17`
- `weekly_return = 3.82`
- `volatility_20d = 12.4`

결과:

- `market_status = up`
- `trend_strength = medium 또는 high`
- `risk_signal = false`

---

### 2. 하락 상태

조건:

- `price_vs_ma20_pct = -4.2`
- `ma5_vs_ma20_pct = -2.1`
- `weekly_return = -5.0`
- `volatility_20d = 14.0`

결과:

- `market_status = down`
- `risk_signal = false`

---

### 3. 횡보 상태

조건:

- `price_vs_ma20_pct = 0.2`
- `ma5_vs_ma20_pct = -0.1`
- `weekly_return = 1.1`
- `volatility_20d = 9.0`

결과:

- `market_status = sideways`

---

### 4. 주의 상태

조건:

- `daily_return = -3.8`
- `weekly_return = -8.5`
- `volatility_20d = 28.0`

결과:

- `market_status = caution`
- `risk_signal = true`
- `risk_reasons`에 위험 코드 포함

---

### 5. 데이터 부족 상태

조건:

- `daily_return`만 존재
- `ma20`, `weekly_return`, `volatility_20d` 없음

결과:

- `market_status = insufficient_data`

---

## 최종 요약

이 스킬의 핵심 역할은 다음과 같다.

- 계산된 핵심 지표를 해석해 현재 시장 상태를 판정한다.
- 상태를 `상승 / 하락 / 횡보 / 주의` 중심으로 단순화한다.
- 위험 신호가 있을 경우 이를 우선 반영한다.
- 판정 근거를 구조화해서 함께 반환한다.
- 후속 요약 생성 스킬이 바로 사용할 수 있게 상태 정보를 제공한다.

즉, 이 스킬은 투자 대시보드 분석 파이프라인의 **핵심 상태 판정 단계**이다.
