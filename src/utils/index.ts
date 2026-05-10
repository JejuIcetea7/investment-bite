import type { PropensityResult } from '../types'

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
  const score = answers.reduce((total, answer, index) => {
    const bonusByQuestion = [12, 14, 13, 11]
    return total + bonusByQuestion[index] * answer
  }, 40)

  let profile: Pick<PropensityResult, 'title' | 'badge' | 'summary' | 'note'>

  if (score < 48) {
    profile = {
      title: '안정형',
      badge: '리스크 관리 우선',
      summary: '손실을 줄이고 흐름을 천천히 확인하는 성향입니다.',
      note: '배당, 대형주, 분산처럼 흔들림이 적은 선택이 잘 맞습니다.',
    }
  } else if (score < 68) {
    profile = {
      title: '균형형',
      badge: '안정과 성장의 중간',
      summary: '안정성과 성장성을 함께 보는 편입니다.',
      note: '대형 우량주와 일부 성장주를 섞는 방식이 어울립니다.',
    }
  } else if (score < 84) {
    profile = {
      title: '성장형',
      badge: '성장 잠재력 중시',
      summary: '조금 더 큰 변동을 감수하고 성장 가능성을 보는 편입니다.',
      note: '실적 개선, 산업 성장성, 중장기 모멘텀을 중요하게 봅니다.',
    }
  } else {
    profile = {
      title: '공격형',
      badge: '높은 변동성 감내',
      summary: '변동성을 감수하더라도 높은 수익 기회를 적극적으로 찾는 성향입니다.',
      note: '변동성이 큰 종목을 다루더라도 비중 관리가 중요합니다.',
    }
  }

  const traits = [
    { label: '안정 추구', val: Math.max(18, 92 - answers[0] * 18 - answers[2] * 10), point: true },
    { label: '장기 투자', val: Math.max(20, 40 + answers[0] * 20 + answers[3] * 10), point: false },
    { label: '리스크 감내', val: Math.max(14, 26 + answers[1] * 24 + answers[2] * 10), point: false },
    { label: '학습 의지', val: Math.max(30, 58 + answers[3] * 12), point: true },
  ]

  return { title: profile.title, badge: profile.badge, score, summary: profile.summary, note: profile.note, traits }
}
