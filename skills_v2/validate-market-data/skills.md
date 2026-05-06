---
name: validate-market-data
description: 가격 시계열 투자 데이터의 기준 시점, 가격 기준값, 날짜 정렬, 필수 값, 선택 값, 결측, 이상치를 검사하고 후속 가격 분석 가능 범위를 판정하는 스킬
---

# validate-market-data

## 목적

이 스킬은 가격 시계열 투자 데이터를 분석하기 전에 입력 데이터 품질을 검증하는 역할을 한다.

이 스킬은 모든 투자 데이터에 대한 범용 검증 문서가 아니다. 범용 투자 데이터 품질 기준은 `shared/references/data-quality-criteria.md`를 따르고, 이 문서는 그중 **가격 시계열 데이터**에 적용되는 구체 기준을 정의한다.

이 스킬의 목적은 다음과 같다.

- 입력 데이터가 분석 가능한 구조인지 확인한다.
- 필수 필드 누락 여부를 검사한다.
- 날짜 형식과 날짜 정렬 상태를 검사한다.
- 가격 및 거래량 값이 유효한지 검사한다.
- 후속 계산 스킬이 사용할 수 있도록 정리된 데이터를 반환한다.
- 어떤 분석이 가능한지 `analysis_ready` 형태로 미리 알려준다.

이 스킬은 계산이나 투자 해석을 수행하지 않는다.  
오직 **가격 시계열 데이터 검증과 제한적 정규화**만 수행한다.

---

## 참고 문서

이 스킬은 다음 공통 기준을 먼저 따른다.

- `shared/references/investment-analysis-principles.md`
- `shared/references/data-quality-criteria.md`
- `shared/references/thresholds.md`

적용 순서:

1. 공통 투자 데이터 품질 기준을 확인한다.
2. 데이터가 가격 시계열로 해석 가능한지 확인한다.
3. 이 문서의 가격 시계열 검증 기준을 적용한다.

---

## 사용할 때

다음 상황에서는 이 스킬을 먼저 실행해야 한다.

- 외부 API에서 시장 데이터를 받아왔을 때
- CSV, JSON, DB에서 시계열 데이터를 불러왔을 때
- 수익률, 이동평균, 변동성 계산 전에
- 데이터 품질이 확실하지 않을 때
- 대시보드 최초 로딩 시 입력 데이터를 점검할 때

즉, 이 스킬은 후속 계산 스킬보다 먼저 실행하는 전처리 단계이다.

---

## 사용하지 않아도 되는 경우

다음 조건을 모두 만족하면 생략할 수 있다.

- 이미 검증된 내부 표준 데이터만 사용한다.
- 데이터 구조와 값의 형식이 완전히 고정되어 있다.
- 날짜 정렬, 타입 검사, 결측 검사 로직이 서버에서 이미 수행되었다.

단, 초기 구현 단계에서는 항상 실행하는 것을 권장한다.

---

## 입력 데이터 형식

기본 입력은 **비교 가능한 기준 시점을 가진 가격 시계열 배열**이다.

초기 기준 필드명은 `date`와 `close`를 사용한다. 단, `close`는 반드시 종가만 의미하지 않고, 분석 대상에 따라 조정종가, 순자산가치, 지수값 등 선택된 가격 기준값을 의미할 수 있다.

```json
[
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
]
```

---

## 필수 필드

아래 필드는 반드시 필요하다.

- `date`
- `close`

이유는 다음과 같다.

- `date`가 없으면 시계열 분석이 불가능하다.
- `close`가 없으면 수익률, 이동평균, 추세 판단의 기본 계산이 불가능하다.

---

## 권장 필드

아래 필드는 있으면 좋다.

- `volume`

이유는 다음과 같다.

- 거래량 변화율 계산 가능
- 거래 활성도 해석 가능
- 위험 신호 보조 판단 가능

---

## 선택 필드

아래 필드는 선택이다.

- `open`
- `high`
- `low`

이유는 다음과 같다.

- 초기 MVP에서는 종가 중심 분석만으로도 충분하다.
- 향후 캔들 차트, 일중 변동폭, 가격 범위 해석에 활용 가능하다.

---

## 검증 규칙

### 1. 입력 타입 검증

입력 데이터는 다음 조건을 만족해야 한다.

- 배열(array)이어야 한다.
- 비어 있지 않아야 한다.
- 각 원소는 객체(object)여야 한다.

무효 예시:

- `null`
- 문자열
- 숫자
- 단일 객체
- 빈 배열

---

### 2. 레코드 구조 검증

각 레코드는 최소한 다음 구조를 가져야 한다.

- 객체(object)
- `date` 포함
- `close` 포함

원칙:

- 필수 필드가 없는 레코드는 유효하지 않다.
- 추가 필드는 허용하되 필수 검증 대상이 아니면 무시할 수 있다.

---

### 3. 날짜 검증

`date`는 다음 조건을 만족해야 한다.

- 문자열(string)이어야 한다.
- `YYYY-MM-DD` 형식이어야 한다.
- 실제 날짜로 해석 가능해야 한다.
- 중복 날짜가 없어야 한다.

유효 예시:

- `2026-05-01`

무효 예시:

- `05/01/2026`
- `2026.05.01`
- `2026/05/01`
- `2026-13-40`
- `""`

처리 원칙:

- 날짜 형식 오류는 `errors`에 기록한다.
- 날짜 중복은 `errors`에 기록한다.
- 날짜 정렬만 틀린 경우 자동 정렬할 수 있다.
- 자동 정렬이 수행되면 `normalization_applied`에 기록한다.

---

### 4. 종가 검증

`close`는 다음 조건을 만족해야 한다.

- 숫자(number)여야 한다.
- `0`보다 커야 한다.
- `null`, `NaN`, 문자열 숫자는 허용하지 않는다.

유효 예시:

- `152.3`
- `100`

무효 예시:

- `0`
- `-10`
- `"152.3"`
- `null`

처리 원칙:

- `close`는 핵심 필수값이다.
- `close`가 유효하지 않으면 해당 레코드는 분석에 사용할 수 없다.
- 유효한 `close`가 너무 적으면 전체 상태를 `invalid`로 본다.

---

### 5. 거래량 검증

`volume`이 존재하면 다음 조건을 만족해야 한다.

- 숫자(number)여야 한다.
- `0` 이상이어야 한다.

유효 예시:

- `0`
- `1200000`

무효 예시:

- `-1`
- `"1000"`
- `null`

처리 원칙:

- 거래량은 권장 필드이므로 없어도 가격 기반 분석을 실패시키지 않는다.
- `volume`이 전체 레코드에 없으면 warning 없이 가격 기반 분석을 계속한다.
- `volume`이 일부 레코드에만 없으면 `warnings`에 `PARTIAL_VOLUME_MISSING`을 기록한다.
- `volume`이 존재하는 레코드 중 invalid volume 비율이 `20%` 미만이면 `warnings`에 기록한다.
- `volume`이 존재하는 레코드 중 invalid volume 비율이 `20%` 이상이면 `errors`에 `INVALID_VOLUME_VALUE`를 기록한다.
- 거래량 오류가 `errors`로 격상되어도 `date`와 `close`가 모두 유효하면 가격 기반 분석 가능 여부는 별도로 판단한다.

---

### 6. 시가 / 고가 / 저가 검증

`open`, `high`, `low`가 존재하면 다음 조건을 만족해야 한다.

- 숫자(number)여야 한다.
- `0`보다 커야 한다.

추가로 다음 관계가 일반적으로 성립해야 한다.

- `high >= low`
- `high >= open`
- `high >= close`
- `low <= open`
- `low <= close`

처리 원칙:

- 이 필드들은 선택 필드이므로 없어도 분석은 가능하다.
- 존재할 경우에는 값의 유효성과 범위를 검사한다.
- 값이 비정상적이면 `warnings` 또는 `errors`로 기록한다.

---

### 7. 날짜 정렬 검증

데이터는 반드시 **과거 → 현재 순의 오름차순**이어야 한다.

처리 원칙:

- 정렬이 틀려 있으면 날짜 기준으로 오름차순 정렬할 수 있다.
- 자동 정렬이 수행되면 `normalization_applied`에 `sorted_by_date_ascending`을 기록한다.
- 정렬 불가 수준으로 날짜 값이 깨져 있으면 `invalid`로 처리한다.

---

### 8. 중복 날짜 검증

같은 `date`가 2회 이상 등장하면 중복으로 본다.

처리 원칙:

- 중복 날짜는 기본적으로 오류로 기록한다.
- 초기 구현에서는 자동 병합하지 않는다.
- 어떤 레코드를 남길지 추측이 필요하면 자동 수정하지 않는다.

---

### 9. 결측치 검증

다음은 결측치로 본다.

- 필드 자체가 없음
- `null`
- 빈 문자열 `""`
- 숫자 필드에 비숫자 값이 들어 있음

처리 원칙:

- 필수 필드 결측은 `errors`
- 권장 필드 결측은 `warnings`
- 선택 필드 결측은 허용

---

### 10. 최소 데이터 개수 검증

후속 분석 가능 여부를 미리 판단해야 한다.

판정 기준:

- 기본 검증 자체: 1개 이상
- 일간 수익률 계산 가능: 2개 이상
- 5일 이동평균 계산 가능: 5개 이상
- 20일 이동평균 계산 가능: 20개 이상
- 20구간 변동성 계산 가능: 21개 이상
- 30일 기준 월간 해석 가능: 31개 이상 권장

이 스킬은 직접 계산하지 않지만,  
후속 단계에서 가능한 분석 범위를 `analysis_ready`로 알려줘야 한다.

---

## 허용되는 정규화

이 스킬은 검증 외에 다음 작업만 제한적으로 수행할 수 있다.

- 날짜 기준 오름차순 정렬
- 알 수 없는 추가 필드 무시
- 내부 표준 순서로 레코드 정리
- 필요 없는 공백 제거

---

## 허용하지 않는 정규화

이 스킬은 다음 작업을 수행하지 않는다.

- 문자열 숫자를 임의로 숫자로 변환
- 잘못된 날짜 포맷을 추측해 수정
- 누락된 종가를 임의 값으로 채움
- 중복 날짜 데이터를 임의 병합
- 음수 가격을 보정
- 누락된 거래량을 추정값으로 채움

원칙:

- 추측이 필요한 자동 수정은 하지 않는다.
- 모호한 보정보다 명시적 오류 기록을 우선한다.

---

## 반환 상태 정의

반환 상태는 아래 세 가지 중 하나여야 한다.

### `valid`

- 분석에 필요한 최소 조건을 만족한다.
- 후속 계산 스킬 실행 가능
- 치명적 오류 없음
- `errors.length = 0`
- `warnings.length = 0`
- 자동 정규화 없음

### `valid_with_warnings`

- 기본 분석은 가능하다.
- 하지만 일부 경고가 존재한다.
- 예: 거래량 일부 누락, 날짜 자동 정렬, 선택 필드 일부 오류

### `invalid`

- 핵심 분석을 수행할 수 없다.
- 예: 필수 필드 누락, 날짜 형식 오류, 종가 오류, 입력 구조 오류

---

## 권장 출력 구조

```json
{
  "status": "valid_with_warnings",
  "is_valid": true,
  "summary": "Market data is usable after sorting. Volume field has partial issues.",
  "cleaned_data": [],
  "errors": [],
  "warnings": [],
  "normalization_applied": [],
  "data_profile": {
    "record_count": 30,
    "has_volume": true,
    "has_ohlc": true,
    "date_range": {
      "start": "2026-04-01",
      "end": "2026-05-03"
    },
    "analysis_ready": {
      "daily_return": true,
      "weekly_return": true,
      "monthly_return": false,
      "ma5": true,
      "ma20": true,
      "volatility_20d": true
    }
  }
}
```

---

## 출력 필드 설명

### `status`

검증 결과 상태

가능한 값:

- `valid`
- `valid_with_warnings`
- `invalid`

### `is_valid`

후속 분석 가능 여부

가능한 값:

- `true`
- `false`

원칙:

- `status = invalid`이면 반드시 `false`

### `summary`

검증 결과를 한 문장으로 요약한 텍스트

예시:

- `Market data is valid and ready for analysis.`
- `Market data is usable, but volume contains missing values.`
- `Market data is invalid due to missing close values.`

### `cleaned_data`

정렬 및 제한적 정규화가 적용된 데이터

원칙:

- 후속 계산 스킬은 원본 대신 이 값을 우선 사용한다.

### `errors`

치명적인 오류 목록

권장 구조:

```json
{
  "code": "MISSING_REQUIRED_FIELD",
  "field": "close",
  "index": 3,
  "message": "close is required and must be a positive number"
}
```

권장 오류 코드:

- `INVALID_INPUT_TYPE`
- `EMPTY_ARRAY`
- `INVALID_RECORD_TYPE`
- `MISSING_REQUIRED_FIELD`
- `INVALID_DATE_FORMAT`
- `DUPLICATE_DATE`
- `INVALID_CLOSE_VALUE`
- `INVALID_VOLUME_VALUE`
- `INVALID_OHLC_VALUE`

### `warnings`

비치명적 문제 목록

예시:

- 거래량 일부 누락
- 날짜 자동 정렬 수행
- 선택 필드 일부 오류
- 추가 필드 무시

권장 경고 코드:

- `MISSING_OPTIONAL_FIELD`
- `PARTIAL_VOLUME_MISSING`
- `SORT_APPLIED`
- `EXTRA_FIELDS_IGNORED`

### `normalization_applied`

자동 정규화 내역 목록

예시:

- `sorted_by_date_ascending`
- `ignored_unknown_fields`

### `data_profile`

데이터 개요 정보

포함 권장 항목:

- 전체 레코드 수
- 거래량 존재 여부
- OHLC 존재 여부
- 시작일 / 종료일
- 분석 가능 범위

---

## analysis_ready 판정 기준

이 스킬은 후속 계산 가능 여부를 미리 표시해야 한다.

판정 기준:

- `daily_return`: 2개 이상
- `weekly_return`: 8개 이상
- `monthly_return`: 31개 이상
- `ma5`: 5개 이상
- `ma20`: 20개 이상
- `volatility_20d`: 21개 이상

예시:

```json
{
  "analysis_ready": {
    "daily_return": true,
    "weekly_return": true,
    "monthly_return": false,
    "ma5": true,
    "ma20": false,
    "volatility_20d": false
  }
}
```

---

## 실행 절차

이 스킬은 아래 순서로 동작한다.

1. 입력이 배열인지 확인한다.
2. 배열이 비어 있지 않은지 확인한다.
3. 각 레코드가 객체인지 확인한다.
4. `date`, `close` 필드 존재 여부를 확인한다.
5. 날짜 형식을 검사한다.
6. 종가 값을 검사한다.
7. 거래량 및 선택 필드를 검사한다.
8. 날짜 중복 여부를 검사한다.
9. 날짜 정렬 상태를 검사한다.
10. 필요한 경우 날짜를 정렬한다.
11. 전체 데이터 개수를 기준으로 분석 가능 범위를 계산한다.
12. 최종 상태와 오류/경고 목록을 생성한다.

---

## 판정 로직

### `invalid`로 처리하는 경우

다음 중 하나라도 해당하면 `invalid`로 처리한다.

- 입력이 배열이 아님
- 배열이 비어 있음
- 레코드가 객체가 아님
- `date` 누락 또는 날짜 형식 오류
- `close` 누락 또는 잘못된 값
- `date` 또는 `close` 오류가 1건 이상 존재함
- 유효한 `date`와 `close`를 가진 레코드가 1개도 없음
- 중복 날짜가 1건 이상 존재함
- invalid `volume` 비율이 volume 보유 레코드의 `20%` 이상이고 거래량 분석이 요청됨

초기 기준에서는 필수 필드가 invalid인 레코드를 제거해 부분 분석하지 않는다. 필수 필드 오류가 있으면 전체 검증 결과를 `invalid`로 둔다.

### `valid_with_warnings`로 처리하는 경우

다음 조건이면 `valid_with_warnings`로 처리한다.

- 핵심 데이터는 유효함
- 하지만 아래 문제 중 하나 이상 존재함
  - 거래량 일부 누락
  - 날짜 자동 정렬 필요
  - 선택 필드 일부 오류
  - 추가 필드 무시

### `valid`로 처리하는 경우

다음 조건이면 `valid`로 처리한다.

- 핵심 구조, 값, 날짜, 정렬 상태가 모두 문제 없음
- `errors.length = 0`
- `warnings.length = 0`
- 자동 정규화 없음

---

## 후속 스킬과의 연결

### `calculate-core-metrics`

사용 값:

- `cleaned_data`
- `analysis_ready`

동작 원칙:

- `is_valid = true`일 때만 계산 수행
- 계산 불가능한 지표는 건너뛴다

### `detect-market-status`

사용 값:

- `analysis_ready`
- 검증 상태
- 오류 및 경고 결과

동작 원칙:

- 데이터 부족이면 `insufficient_data`
- 데이터 오류면 `invalid_data`

### `generate-insight-summary`

사용 값:

- `summary`
- `warnings`
- `data_profile`

동작 원칙:

- 데이터 품질 정보를 최종 설명에 보조적으로 반영할 수 있다

---

## 금지 사항

이 스킬은 다음 작업을 수행하지 않는다.

- 수익률 계산
- 이동평균 계산
- 변동성 계산
- 상승 / 하락 / 횡보 / 주의 상태 판정
- 투자 인사이트 생성
- 임의 데이터 보정

즉, 이 스킬은 **입력 데이터 품질 게이트** 역할만 수행한다.

---

## 예시 시나리오

### 1. 정상 데이터

조건:

- `date`, `close`, `volume` 모두 존재
- 날짜 정렬 정상
- 데이터 30개 이상 존재

결과:

- `status = valid`
- `is_valid = true`

### 2. 날짜 정렬 오류

조건:

- 값은 정상
- 날짜 순서만 섞여 있음

결과:

- 자동 정렬 수행
- `status = valid_with_warnings`
- `normalization_applied`에 기록

### 3. 거래량 일부 누락

조건:

- `date`, `close`는 정상
- `volume` 일부 누락

결과:

- 가격 기반 분석은 가능
- `status = valid_with_warnings`

### 4. 종가 누락

조건:

- 일부 레코드에 `close` 없음

결과:

- 핵심 분석 불가
- `status = invalid`
- `is_valid = false`

### 5. 데이터 개수 부족

조건:

- 데이터 3개만 존재

결과:

- 검증은 통과할 수 있음
- 일부 계산만 가능
- `analysis_ready`에서 가능한 범위를 제한 표시

---

## 최종 요약

이 스킬의 핵심 역할은 다음과 같다.

- 시장 데이터를 검사한다.
- 분석 가능한 형태로 최소 정리한다.
- 오류와 경고를 분리해 반환한다.
- 후속 분석 가능 범위를 알려준다.
- 계산이나 해석은 하지 않는다.

즉, 이 스킬은 투자 대시보드 분석 파이프라인의 **첫 번째 품질 검증 단계**이다.
