import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SECTORS: Record<string, string> = {
  'AI': 'AI 인공지능 엔비디아 주가',
  '반도체': '반도체 삼성전자 SK하이닉스 주가',
  '조선': '조선 HD현대 한화오션 주가',
  '에너지': '에너지 정유 한국전력 주가',
  '헬스': '헬스케어 삼성바이오 셀트리온 주가',
  '우주': '우주항공 한화에어로스페이스 주가',
  '바이오': '바이오 제약 주가 임상',
  '방산': '방산 한화시스템 LIG넥스원 주가',
}

function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_: string, code: string) => String.fromCharCode(parseInt(code)))
    .trim()
}

interface RawArticle {
  title: string
  description: string
  link: string
  source: string
  date: string
}

interface EnrichedArticle extends RawArticle {
  aiSummary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  keywords: string[]
  stocks: string[]
}

async function fetchNaverNews(query: string, display = 4): Promise<RawArticle[]> {
  const clientId = Deno.env.get('NAVER_CLIENT_ID')
  const clientSecret = Deno.env.get('NAVER_CLIENT_SECRET')
  if (!clientId || !clientSecret) throw new Error('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 미설정')

  const url = new URL('https://openapi.naver.com/v1/search/news.json')
  url.searchParams.set('query', query)
  url.searchParams.set('display', String(display))
  url.searchParams.set('sort', 'date')

  const res = await fetch(url.toString(), {
    headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret },
  })
  if (!res.ok) throw new Error(`Naver API ${res.status}`)

  const data = await res.json()
  return (data.items ?? []).map((item: Record<string, string>) => ({
    title: stripHtml(item.title),
    description: stripHtml(item.description),
    link: item.originallink || item.link || '',
    source: (() => {
      try { return new URL(item.originallink || item.link || '').hostname.replace(/^www\./, '') } catch { return '뉴스' }
    })(),
    date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
  }))
}

async function enrichWithAI(articles: RawArticle[]): Promise<EnrichedArticle[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  const fallback: EnrichedArticle[] = articles.map(a => ({
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    })
    if (!res.ok) return fallback

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
  } catch {
    return fallback
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const [topRaw, ...sectorRaws] = await Promise.allSettled([
      fetchNaverNews('증시 주식 시장', 4),
      ...Object.entries(SECTORS).map(([, query]) => fetchNaverNews(query, 4)),
    ])

    const topArticles = topRaw.status === 'fulfilled' ? topRaw.value : []
    const sectorArticlesMap: Record<string, RawArticle[]> = {}
    Object.keys(SECTORS).forEach((sector, i) => {
      sectorArticlesMap[sector] = sectorRaws[i].status === 'fulfilled' ? sectorRaws[i].value : []
    })

    const [topNews, ...sectorEnriched] = await Promise.all([
      enrichWithAI(topArticles),
      ...Object.values(sectorArticlesMap).map(articles => enrichWithAI(articles)),
    ])
    const sectorNews: Record<string, EnrichedArticle[]> = {}
    Object.keys(sectorArticlesMap).forEach((sector, i) => {
      sectorNews[sector] = sectorEnriched[i]
    })

    const payload = {
      generatedAt: new Date().toISOString(),
      topNews,
      sectorNews,
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
