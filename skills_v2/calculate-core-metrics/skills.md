---
name: calculate-core-metrics
description: 검증된 가격 시계열 투자 데이터를 기반으로 수익률, 이동평균, 변동성, 거래량 변화율, 기준 평균 대비 차이율을 계산하는 스킬
---

# calculate-core-metrics

## 목적

이 스킬은 검증된 가격 시계열 투자 데이터를 바탕으로 핵심 계산 지표를 생성하는 역할을 한다.

이 스킬은 모든 투자 데이터의 계산 기준이 아니다. 포트폴리오, 재무제표, 거시지표, 텍스트 신호에는 각 데이터 유형에 맞는 계산 기준을 별도로 적용해야 한다.

이 스킬의 목적은 다음과 같다.

- 종가 데이터를 기준으로 핵심 수익률을 계산한다.
- 단기/중기 가격 흐름을 보기 위한 이동평균을 계산한다.
- 최근 가격 흔들림 정도를 보기 위한 변동성을 계산한다.
- 거래량 변화 정도를 계산한다.
- 후속 상태 판정 스킬과 요약 생성 스킬이 사용할 수 있는 표준 계산 결과를 반환한다.

이 스킬은 **숫자를 계산하는 역할**만 수행한다.  
상승, 하락, 횡보, 주의 같은 상태 해석은 수행하지 않는다.

---

## 참고 문서

이 스킬은 다음 기준을 따른다.

- `shared/references/investment-analysis-principles.md`
- `shared/references/data-quality-criteria.md`
- `shared/references/thresholds.md`

공통 원칙:

- 계산식이 명시된 지표만 계산한다.
- 계산 불가 항목은 `null`로 반환한다.
- 계산 불가 사유는 `missing_metrics`에 기록한다.
- 퍼센트 값은 ratio가 아니라 percent number로 반환한다.
- 반올림은 표시 단계에서만 수행한다.

---

## 사용할 때

다음 상황에서 이 스킬을 사용한다.

- `validate-market-data`가 성공적으로 끝난 뒤
- 시장 데이터의 기본 지표를 계산해야 할 때
- 추세 판정 전에 수치 기반 입력값이 필요할 때
- 대시보드 KPI 카드, 차트, 요약 생성용 수치가 필요할 때
- 후속 `detect-market-status`가 사용할 기준 수치를 생성할 때

즉, 이 스킬은 **검증 이후, 해석 이전** 단계에서 사용한다.

---

## 사용하지 않아도 되는 경우

다음 조건을 모두 만족하면 생략할 수 있다.

- 필요한 지표가 이미 서버 또는 데이터 파이프라인에서 계산되어 있다.
- 계산 결과가 신뢰 가능한 형태로 고정 제공된다.
- 동일 계산을 다시 수행할 필요가 없다.

단, 초기 구현에서는 계산 로직을 명확히 고정하기 위해 이 스킬을 사용하는 것을 권장한다.

---

## 입력 데이터

이 스킬은 기본적으로 `validate-market-data`의 출력을 입력으로 받는다.

권장 입력 구조는 다음과 같다.

```json
{
  "status": "valid",
  "is_valid": true,
  "cleaned_data": [
    {
      "date": "2026-05-01",
      "open": 150.2,
      "high": 154.0,
      "low": 149.8,
      "close": 152.3,
      "volume": 1200000
    },
    {
      "date": "2026-05-02",
      "open": 152.3,
      "high": 153.1,
      "low": 150.9,
      "close": 151.4,
      "volume": 980000
    }
  ],
  "data_profile": {
    "analysis_ready": {
      "daily_return": true,
      "weekly_return": true,
      "monthly_return": false,
      "ma5": true,
      "ma20": false,
      "volatility_20d": false
    }
  }
}
```

---

## 필수 입력 조건

아래 조건을 모두 만족해야 한다.

- `is_valid = true`
- `cleaned_data`가 배열이어야 한다.
- 각 레코드에 `date`, `close`가 존재해야 한다.
- 데이터는 날짜 기준 오름차순이어야 한다.
- 최신 데이터가 배열의 마지막 요소여야 한다.

---

## 권장 입력 조건

다음 조건을 만족하면 더 많은 계산이 가능하다.

- `volume` 존재
- 5개 이상 데이터 존재
- 21개 이상 데이터 존재
- 31개 이상 데이터 존재

---

## 계산 범위

이 스킬은 아래 핵심 지표를 계산한다.

1. 일간 수익률
2. 주간 수익률
3. 월간 수익률
4. 누적 수익률
5. 5일 이동평균
6. 20일 이동평균
7. 60일 이동평균
8. 20일 변동성
9. 거래량 변화율
10. 현재 가격과 이동평균 간 차이율

---

## 계산 원칙

### 1. 기본 가격 기준

- 별도 명시가 없으면 가격 계산은 모두 `close` 기준으로 수행한다.
- 최신 기준 가격은 `cleaned_data`의 마지막 `close` 값이다.

---

### 2. 최신 시점 기준

- 모든 기간 계산은 가장 최근 레코드를 기준으로 수행한다.
- 최신 날짜를 기준으로 과거 데이터를 비교한다.

---

### 3. 계산 불가 항목 처리

- 데이터 개수가 부족하면 해당 항목은 계산하지 않는다.
- 계산 불가 항목은 `null`로 반환한다.
- 계산 불가 사유는 `missing_metrics` 또는 `notes`에 기록할 수 있다.

---

### 4. 계산과 해석 분리

- 이 스킬은 숫자만 계산한다.
- `상승`, `하락`, `주의` 같은 상태 해석은 하지 않는다.
- 계산 결과는 후속 스킬이 해석한다.

---

## 핵심 계산 항목

## 1. 현재 가격 (current_close)

### 정의
가장 최근 날짜의 종가

### 계산 방식
- `current_close = latest.close`

### 목적
- 모든 핵심 비교 계산의 기준값으로 사용

---

## 2. 일간 수익률 (daily_return)

### 정의
가장 최근 종가와 직전 종가를 비교한 변화율

### 계산식
```text
daily_return = ((current_close - previous_close) / previous_close) * 100
```

### 최소 데이터 개수
- 2개 이상

### 반환 예시
- `1.24`
- `-0.85`

---

## 3. 주간 수익률 (weekly_return)

### 정의
가장 최근 종가와 7일 전 기준 종가를 비교한 변화율

### 계산식
```text
weekly_return = ((current_close - close_7d_ago) / close_7d_ago) * 100
```

### 최소 데이터 개수
- 8개 이상

### 주의사항
- 배열 길이를 `n`이라고 할 때 `close[n - 1]`과 `close[n - 8]`을 비교한다.
- 단순히 최근 7개 구간 기준으로 계산한다.
- 거래일 기준으로 구현하며, 실제 달력 주간과는 다를 수 있다.

---

## 4. 월간 수익률 (monthly_return)

### 정의
가장 최근 종가와 30일 전 기준 종가를 비교한 변화율

### 계산식
```text
monthly_return = ((current_close - close_30d_ago) / close_30d_ago) * 100
```

### 최소 데이터 개수
- 31개 이상

### 주의사항
- 배열 길이를 `n`이라고 할 때 `close[n - 1]`과 `close[n - 31]`을 비교한다.
- 초기 기준에서는 최근 30개 간격 기준으로 계산한다.
- 실제 달력 월과 정확히 일치하지 않아도 된다.

---

## 5. 누적 수익률 (cumulative_return)

### 정의
전체 데이터 시작 시점 대비 현재까지의 누적 가격 변화율

### 계산식
```text
cumulative_return = ((current_close - first_close) / first_close) * 100
```

### 최소 데이터 개수
- 2개 이상

### 목적
- 전체 구간 성과를 한 번에 보여주기 위함

---

## 6. 5일 이동평균 (ma5)

### 정의
최근 5개 종가의 평균

### 계산식
```text
ma5 = average(last 5 close values)
```

### 최소 데이터 개수
- 5개 이상

### 목적
- 단기 가격 흐름 파악

---

## 7. 20일 이동평균 (ma20)

### 정의
최근 20개 종가의 평균

### 계산식
```text
ma20 = average(last 20 close values)
```

### 최소 데이터 개수
- 20개 이상

### 목적
- 중기 흐름 파악
- 후속 추세 판정의 핵심 기준값

---

## 8. 60일 이동평균 (ma60)

### 정의
최근 60개 종가의 평균

### 계산식
```text
ma60 = average(last 60 close values)
```

### 최소 데이터 개수
- 60개 이상

### 목적
- 장기 흐름 참고용
- 초기 MVP에서는 선택 계산 항목으로 둘 수 있다

---

## 9. 20일 변동성 (volatility_20d)

### 정의
최근 20개 구간의 가격 변화율을 기준으로 계산한 변동성

### 계산 원칙
초기 구현에서는 **일간 수익률 시퀀스의 표준편차 기반 변동성**을 사용한다.

### 계산 절차
1. 최근 21개 가격을 선택한다.
2. 21개 가격에서 20개 연속 일간 수익률 배열을 생성한다.
3. 해당 수익률 배열의 모집단 표준편차를 계산한다.
4. 결과는 퍼센트 숫자로 반환한다.

### 권장 계산식 개념
```text
returns[i] = ((close[i] - close[i-1]) / close[i-1]) * 100
volatility_20d = population_stddev(last 20 daily percent returns)
```

### 최소 데이터 개수
- 21개 이상

### 목적
- 가격 흔들림 정도를 수치로 제공

### 주의사항
- 이 스킬은 변동성이 높다/낮다를 해석하지 않는다.
- 그 판단은 `thresholds.md`와 `detect-market-status`가 담당한다.

---

## 10. 거래량 변화율 (volume_change_rate)

### 정의
가장 최근 거래량과 직전 거래량을 비교한 변화율

### 계산식
```text
volume_change_rate = ((current_volume - previous_volume) / previous_volume) * 100
```

### 최소 데이터 개수
- 2개 이상
- `volume` 필드가 있어야 함

### 주의사항
- 직전 거래량이 0이면 계산하지 않는다.
- 계산 불가 시 `null` 반환

---

## 11. 현재 가격과 20일 이동평균 차이율 (price_vs_ma20_pct)

### 정의
현재 가격이 20일 이동평균보다 얼마나 위 또는 아래에 있는지 보여주는 비율

### 계산식
```text
price_vs_ma20_pct = ((current_close - ma20) / ma20) * 100
```

### 최소 데이터 개수
- 20개 이상

### 목적
- 현재 가격이 평균선 대비 얼마나 이탈했는지 파악
- 후속 추세 및 위험 신호 판정에 사용

---

## 12. 5일 이동평균과 20일 이동평균 차이율 (ma5_vs_ma20_pct)

### 정의
단기 평균과 중기 평균의 차이를 비율로 표현한 값

### 계산식
```text
ma5_vs_ma20_pct = ((ma5 - ma20) / ma20) * 100
```

### 최소 데이터 개수
- 20개 이상

### 목적
- 단기 흐름이 중기 흐름보다 강한지 비교
- 후속 추세 판정에 사용

---

## 계산 우선순위

아래 순서로 계산하는 것을 권장한다.

1. 최신 가격 추출
2. 기간별 수익률 계산
3. 이동평균 계산
4. 변동성 계산
5. 거래량 변화율 계산
6. 평균선 대비 차이율 계산
7. 계산 결과 구조화

---

## 입력 데이터 사용 규칙

### 1. 원본이 아닌 cleaned_data 사용

- 반드시 `validate-market-data`의 `cleaned_data`를 우선 사용한다.
- 원본 데이터는 직접 계산에 사용하지 않는다.

---

### 2. 최신 데이터 기준

- 항상 마지막 레코드를 최신 데이터로 본다.
- 마지막 레코드의 `close`를 `current_close`로 사용한다.

---

### 3. null 허용 규칙

- 계산이 불가능한 항목은 `null`로 반환한다.
- 잘못된 추정값을 만들지 않는다.

---

## 반환 구조

이 스킬은 아래 형태의 결과를 반환하는 것을 권장한다.

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

## 출력 필드 설명

### `status`

계산 결과 상태

가능한 값:

- `success`
- `partial_success`
- `failed`

원칙:

- `current_close`를 계산할 수 없으면 `failed`
- `current_close`, `daily_return`, `weekly_return`, `ma5`, `ma20`, `volatility_20d`가 모두 계산되면 `success`
- `current_close`는 계산되지만 위 핵심 지표 중 1개 이상이 `null`이면 `partial_success`

---

### `summary`

계산 결과 한 줄 요약

예시:

- `Core market metrics calculated successfully.`
- `Core metrics calculated partially due to insufficient history.`
- `Metric calculation failed because input data is invalid.`

---

### `metrics`

실제 계산된 핵심 지표 객체

포함 권장 항목:

- `current_close`
- `daily_return`
- `weekly_return`
- `monthly_return`
- `cumulative_return`
- `ma5`
- `ma20`
- `ma60`
- `volatility_20d`
- `volume_change_rate`
- `price_vs_ma20_pct`
- `ma5_vs_ma20_pct`

---

### `available_metrics`

실제로 계산에 성공한 항목 목록

목적:

- 후속 스킬이 어떤 수치를 사용할 수 있는지 즉시 알 수 있게 함

---

### `missing_metrics`

계산하지 못한 항목 목록

목적:

- 어떤 값이 데이터 부족 때문에 빠졌는지 명확히 알 수 있게 함

---

### `meta`

계산에 사용된 메타 정보

포함 권장 항목:

- `record_count`
- `latest_date`
- `used_price_field`
- `used_volume_field`

---

## 실행 절차

이 스킬은 아래 순서로 동작한다.

1. 입력이 유효한 검증 결과인지 확인한다.
2. `is_valid = true`인지 확인한다.
3. `cleaned_data`를 읽는다.
4. 최신 날짜와 최신 종가를 추출한다.
5. 데이터 개수에 따라 가능한 수익률을 계산한다.
6. 데이터 개수에 따라 가능한 이동평균을 계산한다.
7. 데이터 개수에 따라 가능한 변동성을 계산한다.
8. 거래량이 있으면 거래량 변화율을 계산한다.
9. 이동평균이 있으면 평균선 대비 차이율을 계산한다.
10. 계산 성공/실패 항목을 분리한다.
11. 최종 결과를 표준 구조로 반환한다.

---

## 계산 가능 조건

아래 기준으로 각 항목 계산 가능 여부를 판단한다.

- `current_close`: 1개 이상
- `daily_return`: 2개 이상
- `weekly_return`: 8개 이상
- `monthly_return`: 31개 이상
- `cumulative_return`: 2개 이상
- `ma5`: 5개 이상
- `ma20`: 20개 이상
- `ma60`: 60개 이상
- `volatility_20d`: 21개 이상
- `volume_change_rate`: 2개 이상 + volume 존재
- `price_vs_ma20_pct`: ma20 계산 가능
- `ma5_vs_ma20_pct`: ma5, ma20 계산 가능

---

## 예외 처리 규칙

### 1. 입력 데이터 무효

조건:

- `is_valid = false`
- `cleaned_data` 없음
- 배열이 비어 있음

처리:

- `status = failed`
- `metrics = {}`
- `summary`에 실패 사유 기록

---

### 2. 데이터 개수 부족

조건:

- `current_close`는 계산 가능함
- `current_close`, `daily_return`, `weekly_return`, `ma5`, `ma20`, `volatility_20d` 중 1개 이상이 `null`

처리:

- 계산 가능한 항목만 계산
- 계산 불가 항목은 `null`
- `status = partial_success` 가능
- `missing_metrics`에 기록

---

### 3. 거래량 계산 불가

조건:

- `volume` 없음
- `previous_volume = 0`
- 일부 volume 값이 유효하지 않음

처리:

- `volume_change_rate = null`
- `missing_metrics`에 기록

---

### 4. 이동평균 기반 비교 불가

조건:

- `ma20` 없음
- `ma5` 없음

처리:

- 관련 파생 지표는 `null`
- 억지 계산하지 않음

---

## 금지 사항

이 스킬은 다음을 수행하지 않는다.

- 상승 / 하락 / 횡보 / 주의 상태 판정
- 위험 신호 해석
- 투자 의견 생성
- 뉴스 해석
- 차트 종류 선택
- 요약 문장 생성
- 데이터 정제 및 보정

즉, 이 스킬은 **수치 계산 전용 스킬**이다.

---

## 후속 스킬과의 연결

### `detect-market-status`

이 스킬은 아래 계산 결과를 전달한다.

- `daily_return`
- `weekly_return`
- `monthly_return`
- `ma5`
- `ma20`
- `volatility_20d`
- `price_vs_ma20_pct`
- `ma5_vs_ma20_pct`
- `volume_change_rate`

`detect-market-status`는 이 숫자를 기준으로 상승/하락/횡보/주의를 판정한다.

---

### `generate-insight-summary`

이 스킬은 아래 계산 결과를 전달한다.

- 현재 가격
- 수익률
- 이동평균
- 변동성
- 거래량 변화율

`generate-insight-summary`는 이 값을 사람이 이해하기 쉬운 문장으로 바꾼다.

---

## 예시 시나리오

### 1. 데이터가 30개 있는 경우

가능한 계산:

- `current_close`
- `daily_return`
- `weekly_return`
- `cumulative_return`
- `ma5`
- `ma20`
- `volatility_20d`
- `volume_change_rate`
- `price_vs_ma20_pct`
- `ma5_vs_ma20_pct`

불가능한 계산:

- `ma60`
- `monthly_return`은 데이터 개수 기준에 따라 불가할 수 있음

---

### 2. 데이터가 5개 있는 경우

가능한 계산:

- `current_close`
- `daily_return`
- `cumulative_return`
- `ma5`

불가능한 계산:

- `weekly_return`
- `monthly_return`
- `ma20`
- `ma60`
- `volatility_20d`

---

### 3. 거래량이 없는 경우

가능한 계산:

- `current_close`
- `daily_return`
- `weekly_return`
- `cumulative_return`
- `ma5`
- `ma20`
- `volatility_20d`
- `price_vs_ma20_pct`
- `ma5_vs_ma20_pct`

불가능한 계산:

- `volume_change_rate`

처리:

- 거래량 관련 항목만 `null`
- 전체 계산은 계속 수행

---

## 최종 요약

이 스킬의 핵심 역할은 다음과 같다.

- 검증된 시장 데이터에서 핵심 숫자를 계산한다.
- 수익률, 이동평균, 변동성, 거래량 변화율을 표준 형식으로 반환한다.
- 계산 가능한 항목과 불가능한 항목을 명확히 구분한다.
- 후속 상태 판정과 요약 생성이 바로 사용할 수 있는 구조를 제공한다.
- 해석은 하지 않고, 계산만 수행한다.

즉, 이 스킬은 투자 대시보드 분석 파이프라인의 **핵심 수치 계산 단계**이다.
