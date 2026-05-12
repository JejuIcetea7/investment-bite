import type { PropensityResult } from '../types'
import { PROPENSITY_QUESTIONS } from '../constants'

export function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[\s._-]/g, '')
}

export function formatRelativeDate(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}시간 전`
  return `${Math.floor(diffHr / 24)}일 전`
}

export function createPropensityResult(answers: number[]): PropensityResult {
  const score = Math.round(answers.reduce((total, answer) => total + answer, 0) / 8 * 100)

  let profile: Pick<PropensityResult, 'title' | 'badge' | 'summary' | 'note' | 'characterImage' | 'characterAlt'>

  if (score < 20) {
    profile = {
      title: '안정 보관형',
      badge: '손실 관리 우선',
      summary: '큰 수익보다 자산을 지키는 안정감을 먼저 보는 성향입니다.',
      note: '예금성 상품, 배당주, 대형 우량주처럼 변동이 낮은 선택지가 잘 맞습니다.',
      characterImage: '/charcter/하트_아이콘.png',
      characterAlt: '안정 보관형 캐릭터',
    }
  } else if (score < 40) {
    profile = {
      title: '신중 균형형',
      badge: '안정과 성장의 균형',
      summary: '위험을 크게 키우지 않으면서 성장 기회도 함께 살피는 성향입니다.',
      note: '분산 투자와 꾸준한 리밸런싱으로 속도를 조절하는 방식이 어울립니다.',
      characterImage: '/charcter/공부하는_아이콘.png',
      characterAlt: '신중 균형형 캐릭터',
    }
  } else if (score < 60) {
    profile = {
      title: '성장 탐색형',
      badge: '성장 기회 탐색',
      summary: '안정성을 완전히 놓지 않으면서도 성장 가능성에 관심이 큰 성향입니다.',
      note: '실적 개선, 산업 성장성, 중장기 모멘텀을 함께 확인하는 습관이 중요합니다.',
      characterImage: '/charcter/궁금한_아이콘.png',
      characterAlt: '성장 탐색형 캐릭터',
    }
  } else if (score < 80) {
    profile = {
      title: '적극 투자형',
      badge: '기회 포착 중심',
      summary: '변동성을 어느 정도 감수하고 더 높은 수익 기회를 찾는 성향입니다.',
      note: '관심 종목을 좁혀 보더라도 손절 기준과 비중 관리가 함께 필요합니다.',
      characterImage: '/charcter/진입_아이콘.png',
      characterAlt: '적극 투자형 캐릭터',
    }
  } else {
    profile = {
      title: '고위험 도전형',
      badge: '높은 변동성 감내',
      summary: '큰 변동을 감수하더라도 강한 수익 기회를 적극적으로 찾는 성향입니다.',
      note: '테마성 종목이나 고성장 자산을 볼 때는 투자 금액 제한과 분할 접근이 특히 중요합니다.',
      characterImage: '/charcter/느낌표_아이콘.png',
      characterAlt: '고위험 도전형 캐릭터',
    }
  }

  const traits = [
    { label: '안정 추구', val: Math.max(18, 92 - answers[0] * 18 - answers[2] * 10), point: true },
    { label: '장기 투자', val: Math.max(20, 40 + answers[0] * 20 + answers[3] * 10), point: false },
    { label: '리스크 감내', val: Math.max(14, 26 + answers[1] * 24 + answers[2] * 10), point: false },
    { label: '학습 의지', val: Math.max(30, 58 + answers[3] * 12), point: true },
  ]

  return {
    title: profile.title,
    badge: profile.badge,
    score,
    summary: profile.summary,
    note: profile.note,
    characterImage: profile.characterImage,
    characterAlt: profile.characterAlt,
    strengths: buildRuleStrengths(answers),
    cautions: buildRuleCautions(score),
    recommendation: profile.note,
    analysisSource: 'rule',
    traits,
  }
}

export function createPropensitySurveyPayload(answers: number[], result: PropensityResult) {
  return {
    result: {
      title: result.title,
      badge: result.badge,
      score: result.score,
      summary: result.summary,
      note: result.note,
    },
    answers: PROPENSITY_QUESTIONS.map((question, index) => ({
      question: question.q,
      answer: question.opts[answers[index]] ?? '',
      answerIndex: answers[index],
    })),
  }
}

function buildRuleStrengths(answers: number[]) {
  const strengths = [
    answers[0] >= 1 ? '투자 기간을 짧게만 보지 않고 흐름을 기다릴 수 있습니다.' : '짧은 기간 안에서 위험을 빠르게 줄이려는 판단이 빠릅니다.',
    answers[1] >= 1 ? '하락 상황에서도 즉시 반응하기보다 상황을 확인하려는 편입니다.' : '손실 확대를 경계하고 방어적으로 움직이는 편입니다.',
    answers[2] >= 1 ? '안정성과 성장성 사이의 균형을 의식합니다.' : '투자 판단에서 안정성을 우선 확인합니다.',
  ]
  return strengths.slice(0, 3)
}

function buildRuleCautions(score: number) {
  if (score < 40) {
    return ['너무 방어적으로만 접근하면 성장 기회를 놓칠 수 있습니다.', '안정 자산 안에서도 수익률과 비용 차이를 비교해보는 것이 좋습니다.']
  }
  if (score < 70) {
    return ['관심 종목이 늘어날수록 투자 기준이 흐려질 수 있습니다.', '성장성을 볼 때는 실적과 밸류에이션을 함께 확인해야 합니다.']
  }
  return ['높은 변동성 구간에서는 손실 폭이 예상보다 커질 수 있습니다.', '확신이 큰 종목일수록 비중과 손절 기준을 먼저 정해야 합니다.']
}
