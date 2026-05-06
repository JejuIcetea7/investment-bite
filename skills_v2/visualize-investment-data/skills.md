---
name: visualize-investment-data
description: 투자 데이터의 유형, 계산 지표, 해석 신호, 데이터 품질 상태를 기준으로 적절한 시각화 방식과 표시 제한 조건을 정하는 범용 시각화 기준 스킬
---

# visualize-investment-data

## 목적

이 스킬은 투자 데이터 분석 결과를 어떤 방식으로 시각화해야 하는지 정하는 기준이다.

이 문서는 특정 프로그램, 특정 프레임워크, 특정 대시보드 컴포넌트를 구현하기 위한 명세가 아니다.  
가격, 포트폴리오, 재무제표, 수급, 거시지표, 텍스트 신호 등 투자 데이터 전반에 적용할 수 있는 **시각화 판단 기준서**이다.

---

## 참고 문서

이 스킬은 다음 문서를 따른다.

- `shared/references/investment-analysis-principles.md`
- `shared/references/data-quality-criteria.md`
- `shared/references/signal-status-rules.md`
- `shared/references/visualization-guidelines.md`
- `shared/references/safety-expression-rules.md`
- `shared/references/reason-codes.md`

---

## 입력 전제

시각화 기준을 정하기 전에 아래 정보가 있어야 한다.

| 항목 | 필요성 |
|---|---|
| data_category | 어떤 유형의 투자 데이터인지 알아야 시각화 방식을 선택할 수 있다. |
| available_metrics | 표시 가능한 지표만 시각화해야 한다. |
| missing_metrics | 계산되지 않은 지표는 차트나 카드로 표시하지 않는다. |
| signal | 긍정, 부정, 중립, 주의, 데이터 부족, 데이터 오류 상태를 표현하기 위해 필요하다. |
| reason_codes | 강조해야 할 근거를 선택하기 위해 필요하다. |
| risk_reasons | 주의 배지나 경고 영역 표시 여부를 결정한다. |
| data_quality | 데이터 신뢰도와 제한사항을 함께 표시하기 위해 필요하다. |
| limitations | 시각화 하단 또는 보조 설명에 표시한다. |

---

## 공통 시각화 원칙

### 1. 데이터 형태에 맞는 표현을 선택한다

| 데이터 형태 | 시각화 기준 |
|---|---|
| 시간 순서가 있는 연속 값 | 라인 차트 |
| 기간별 독립 값 | 막대 차트 |
| 항목별 비중 | 도넛 차트 또는 스택 막대 |
| 여러 지표의 기간 비교 | 그룹 막대 차트 |
| 최신 단일 값 | KPI 값 |
| 위험 조건 | 경고 배지 또는 강조 영역 |
| 데이터 품질 | 상태 라벨 |
| 데이터 부족 | 빈 상태 설명 |

### 2. 계산되지 않은 값은 표시하지 않는다

- 값이 `null`인 지표는 차트 축, 선, 카드, 비교 문장에 사용하지 않는다.
- `missing_metrics`에 포함된 지표는 숨기거나 "계산 불가"로 표시한다.
- 계산 불가 사유는 `limitations` 또는 데이터 품질 설명으로 제공한다.

### 3. 위험 신호는 항상 시각적으로 분리한다

`signal = caution` 또는 `risk_reasons.length >= 1`이면 다음 중 하나를 사용한다.

- warning badge
- highlighted row
- caution box
- risk reason list

위험 신호가 있으면 원인을 함께 표시한다. 원인 없는 "주의" 표시는 사용하지 않는다.

### 4. 데이터 오류와 데이터 부족은 구분한다

| 상태 | 표시 기준 |
|---|---|
| `invalid_data` | 오류 상태와 invalid reason 표시 |
| `insufficient_data` | 빈 상태와 missing metric 표시 |

`invalid_data`는 분석 신뢰 불가 상태이다.  
`insufficient_data`는 데이터 구조는 유효하지만 분석 근거가 부족한 상태이다.

---

## 데이터 유형별 시각화 기준

## 1. 가격 시계열 데이터

### 표시 가능한 요소

| 분석 항목 | 조건 | 시각화 |
|---|---|---|
| 최신 가격 | 가격 기준값 1개 이상 | KPI 값 |
| 가격 흐름 | 가격 기준값 2개 이상 | 라인 차트 |
| 5기간 이동평균 | 5개 이상 | 라인 차트 오버레이 |
| 20기간 이동평균 | 20개 이상 | 라인 차트 오버레이 |
| 기간 수익률 | 계산된 수익률 1개 이상 | KPI 카드 또는 막대 차트 |
| 변동성 | `volatility_20d` 존재 | KPI 카드 |
| 거래량 | 유효한 volume 2개 이상 | 막대 차트 |

### 주의 표시 조건

다음 중 하나이면 위험 표시를 추가한다.

- `daily_return <= -3.0`
- `weekly_return <= -7.0`
- `volatility_20d >= 25`
- `price_vs_ma20_pct <= -5.0`
- `volume_change_rate >= 50` and `abs(daily_return) >= 2.0`

---

## 2. 포트폴리오 데이터

### 표시 가능한 요소

| 분석 항목 | 조건 | 시각화 |
|---|---|---|
| 보유 자산 비중 | 총 평가금액 > 0 | 도넛 차트 또는 스택 막대 |
| 상위 보유 종목 | 보유 자산 1개 이상 | 순위 테이블 |
| 자산군 비중 | asset class 존재 | 스택 막대 |
| 통화 노출 | currency 존재 | 막대 차트 |
| 집중도 위험 | 단일 자산 또는 상위 3개 비중 계산 가능 | 경고 배지 |

### 주의 표시 조건

- 단일 자산 비중 `>= 30%`
- 상위 3개 자산 비중 합계 `>= 60%`
- 평가금액이 음수인 자산 1개 이상
- 통화 정보가 필요한 분석에서 currency 누락

---

## 3. 재무제표 데이터

### 표시 가능한 요소

| 분석 항목 | 조건 | 시각화 |
|---|---|---|
| 매출 추이 | 비교 가능한 기간 2개 이상 | 막대 차트 |
| 영업이익 추이 | 비교 가능한 기간 2개 이상 | 막대 차트 |
| 순이익 추이 | 비교 가능한 기간 2개 이상 | 막대 차트 |
| 이익률 추이 | 매출과 이익 값 존재 | 라인 차트 |
| 부채비율 | 부채와 자본 값 존재 | KPI 또는 라인 차트 |
| 현금흐름 | 기간별 현금흐름 값 존재 | 막대 차트 |

### 주의 표시 조건

- 매출 성장률 `<= -10%`
- 영업이익률이 전기 대비 `5` percentage points 이상 하락
- 부채비율이 전기 대비 `20` percentage points 이상 상승
- 영업현금흐름이 음수

---

## 4. 거래량 / 수급 데이터

### 표시 가능한 요소

| 분석 항목 | 조건 | 시각화 |
|---|---|---|
| 거래량 추이 | 기간별 거래량 2개 이상 | 막대 차트 |
| 유입/유출 비교 | inflow와 outflow 존재 | 그룹 막대 차트 |
| 순유입 추이 | net flow 2개 이상 | 라인 차트 또는 막대 차트 |
| 이상 수급 | 전기 대비 변화율 계산 가능 | 강조 막대 또는 경고 배지 |

### 주의 표시 조건

- net outflow가 음수이고 전기 대비 절대 변화율 `>= 30%`
- 거래량 변화율 `>= 50%`이고 가격 변화율 절대값 `>= 2%`

---

## 5. 거시경제 지표

### 표시 가능한 요소

| 분석 항목 | 조건 | 시각화 |
|---|---|---|
| 지표 추이 | 비교 가능한 기간 2개 이상 | 라인 차트 |
| 기준선 비교 | 명시된 threshold 존재 | 기준선 포함 라인 차트 |
| 기간 변화 | 전기 비교 가능 | 막대 차트 |
| 최신 값 | 값 1개 이상 | KPI 값 |

### 주의 표시 조건

- 지표별 불리한 방향 임계값을 명시한 경우에만 caution 표시
- 임계값이 없으면 방향성만 표시하고 위험 판정은 하지 않는다

---

## 6. 뉴스 / 텍스트 신호

### 표시 가능한 요소

| 분석 항목 | 조건 | 시각화 |
|---|---|---|
| 감성 근거 수 | positive/negative/neutral count 존재 | 막대 차트 또는 카운트 테이블 |
| 위험 키워드 | risk keyword count 존재 | 배지 또는 리스트 |
| 출처 분포 | source count 존재 | 테이블 또는 막대 차트 |
| 주요 테마 | 분류된 테마 존재 | 태그 목록 |

### 주의 표시 조건

- risk 또는 uncertainty 근거 수가 positive 근거 수 이상이고 risk count `>= 2`
- 단일 출처 비중 `> 70%`
- publication time이 없는 텍스트가 전체의 `30%` 이상

---

## 출력 기준

시각화 기준 결과는 아래 항목을 포함해야 한다.

```json
{
  "status": "success",
  "data_category": "price_series",
  "recommended_visuals": [],
  "hidden_visuals": [],
  "status_visual": {
    "signal": "caution",
    "visual_role": "warning",
    "label": "주의"
  },
  "data_quality_visual": {
    "label": "일부 데이터 부족",
    "limitations": []
  }
}
```

필수 원칙:

- `recommended_visuals`에는 표시 가능한 항목만 넣는다.
- `hidden_visuals`에는 계산 불가 또는 데이터 부족으로 숨긴 항목과 사유를 넣는다.
- `status_visual.visual_role`은 `positive`, `negative`, `neutral`, `warning`, `muted`, `error` 중 하나로 둔다.

---

## 금지 사항

이 스킬은 다음을 하지 않는다.

- 수치 계산
- 투자 신호 재판정
- 투자 추천
- 특정 UI 프레임워크 구현
- 없는 지표를 임의로 시각화
- missing value를 0처럼 표시
