import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const outputPath = path.resolve(rootDir, 'public/data/news.json')
const MAX_AGE_MS = 30 * 60 * 1000 // 30분 이내 데이터는 스킵

const SECTORS = {
  'AI': 'AI 인공지능 엔비디아 주가',
  '반도체': '반도체 삼성전자 SK하이닉스 주가',
  '조선': '조선 HD현대 한화오션 주가',
  '에너지': '에너지 정유 한국전력 주가',
  '헬스': '헬스케어 삼성바이오 셀트리온 주가',
  '우주': '우주항공 한화에어로스페이스 주가',
  '바이오': '바이오 제약 주가 임상',
  '방산': '방산 한화시스템 LIG넥스원 주가',
}

async function loadEnv() {
  try {
    const content = await readFile(path.resolve(rootDir, '.env'), 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      if (key && !process.env[key]) process.env[key] = value
    }
  } catch {}
}

function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .trim()
}

async function fetchNaverNews(query, display = 4) {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 미설정')

  const url = new URL('https://openapi.naver.com/v1/search/news.json')
  url.searchParams.set('query', query)
  url.searchParams.set('display', String(display))
  url.searchParams.set('sort', 'date')

  const res = await fetch(url.toString(), {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
  })
  if (!res.ok) throw new Error(`Naver API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return (data.items ?? []).map(item => ({
    title: stripHtml(item.title),
    description: stripHtml(item.description),
    link: item.originallink || item.link || '',
    source: (() => {
      try { return new URL(item.originallink || item.link || '').hostname.replace(/^www\./, '') } catch { return '뉴스' }
    })(),
    date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
  }))
}

async function enrichWithAI(articles) {
  const apiKey = process.env.OPENAI_API_KEY
  const fallback = articles.map(a => ({
    ...a, aiSummary: a.description, sentiment: 'neutral', sentimentScore: 0, keywords: [], stocks: [],
  }))
  if (!apiKey || articles.length === 0) return fallback

  const articlesText = articles
    .map((a, i) => `[${i}] 제목: ${a.title}\n내용: ${a.description}`)
    .join('\n\n')

  const prompt = `다음 주식/증시 뉴스 기사들을 분석하세요. JSON 배열만 응답하세요 (다른 텍스트 없이).

기사:
${articlesText}

각 기사에 대해 다음 형식으로 응답:
[
  {
    "summary": "2-3문장 한국어 요약",
    "sentiment": "positive" | "neutral" | "negative",
    "sentimentScore": -1.0 ~ 1.0 사이 숫자 (주식/증시에 미치는 영향),
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "stocks": ["종목명1", "종목명2"]
  }
]`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    })
    if (!res.ok) { console.warn('OpenAI API 오류:', res.status); return fallback }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    const enrichments = Array.isArray(parsed) ? parsed : (parsed.results ?? parsed.articles ?? [])

    return articles.map((article, i) => ({
      ...article,
      aiSummary: enrichments[i]?.summary ?? article.description,
      sentiment: enrichments[i]?.sentiment ?? 'neutral',
      sentimentScore: enrichments[i]?.sentimentScore ?? 0,
      keywords: enrichments[i]?.keywords ?? [],
      stocks: enrichments[i]?.stocks ?? [],
    }))
  } catch (e) {
    console.warn('OpenAI 파싱 오류:', e.message)
    return fallback
  }
}

async function main() {
  await loadEnv()

  // 최신 데이터 스킵 체크
  try {
    const existing = JSON.parse(await readFile(outputPath, 'utf8'))
    const age = Date.now() - new Date(existing.generatedAt).getTime()
    if (age < MAX_AGE_MS) {
      console.log(`뉴스 데이터가 최신입니다 (${Math.round(age / 60000)}분 전). 스킵합니다.`)
      return
    }
  } catch {}

  console.log('뉴스 데이터 수집 중...')

  // Naver API 병렬 요청
  const [topRaw, ...sectorRaws] = await Promise.allSettled([
    fetchNaverNews('증시 주식 시장', 4),
    ...Object.entries(SECTORS).map(([, query]) => fetchNaverNews(query, 4)),
  ])

  const topArticles = topRaw.status === 'fulfilled' ? topRaw.value : []
  if (topRaw.status === 'rejected') console.warn('주요뉴스 수집 실패:', topRaw.reason?.message)
  else console.log(`주요뉴스 ${topArticles.length}개 수집`)

  const sectorArticlesMap = {}
  Object.keys(SECTORS).forEach((sector, i) => {
    const result = sectorRaws[i]
    sectorArticlesMap[sector] = result.status === 'fulfilled' ? result.value : []
    if (result.status === 'rejected') console.warn(`${sector} 뉴스 실패:`, result.reason?.message)
    else console.log(`${sector} ${sectorArticlesMap[sector].length}개 수집`)
  })

  // AI 분석 (주요뉴스 + 섹터별 순차 처리)
  console.log('AI 분석 중...')
  const topNews = await enrichWithAI(topArticles)

  const sectorNews = {}
  for (const [sector, articles] of Object.entries(sectorArticlesMap)) {
    sectorNews[sector] = await enrichWithAI(articles)
    await new Promise(r => setTimeout(r, 300))
  }

  const hasAnyData = topNews.length > 0 || Object.values(sectorNews).some(articles => articles.length > 0)
  if (!hasAnyData) {
    console.warn('수집된 뉴스가 없습니다. 기존 파일을 유지합니다.')
    return
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    topNews,
    sectorNews,
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`뉴스 데이터 저장 완료: ${path.relative(process.cwd(), outputPath)}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
