import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CACHE_TTL_MS = 30 * 60 * 1000

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

async function fetchNaverNews(name: string): Promise<{ title: string; description: string }[]> {
  const clientId = Deno.env.get('NAVER_CLIENT_ID')
  const clientSecret = Deno.env.get('NAVER_CLIENT_SECRET')
  if (!clientId || !clientSecret) return []

  const url = new URL('https://openapi.naver.com/v1/search/news.json')
  url.searchParams.set('query', `${name} 주가`)
  url.searchParams.set('display', '5')
  url.searchParams.set('sort', 'date')

  const res = await fetch(url.toString(), {
    headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret },
  })
  if (!res.ok) return []

  const data = await res.json()
  return (data.items ?? []).map((item: Record<string, string>) => ({
    title: stripHtml(item.title),
    description: stripHtml(item.description),
  }))
}

interface WhyResult {
  tag: string
  title: string
  summary: string
  bullets: string[]
}

async function generateWhy(name: string, percent: string, articles: { title: string; description: string }[]): Promise<WhyResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  const isUp = !percent.startsWith('-')
  const fallback: WhyResult = {
    tag: '왜 움직였을까?',
    title: `${name} ${percent} ${isUp ? '상승' : '하락'}`,
    summary: '최근 뉴스를 불러오지 못했습니다.',
    bullets: [],
  }
  if (!apiKey) return fallback

  const newsText = articles.length > 0
    ? articles.map((a, i) => `[${i + 1}] ${a.title}\n${a.description}`).join('\n\n')
    : '관련 뉴스 없음'

  const prompt = `다음은 ${name} 주식의 최근 뉴스입니다. 이 종목이 오늘 ${percent} ${isUp ? '상승' : '하락'}한 이유를 뉴스 근거로 간결하게 설명해주세요.

뉴스:
${newsText}

다음 JSON 형식으로만 응답하세요:
{
  "summary": "2문장 이내 핵심 요약",
  "bullets": ["핵심 이유 1", "핵심 이유 2", "핵심 이유 3"]
}`

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
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    return {
      tag: '왜 움직였을까?',
      title: `${name} ${percent} ${isUp ? '상승' : '하락'}`,
      summary: parsed.summary ?? fallback.summary,
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 3) : [],
    }
  } catch {
    return fallback
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const url = new URL(req.url)
    const symbol = url.searchParams.get('symbol') ?? ''
    const name = url.searchParams.get('name') ?? symbol
    const percent = url.searchParams.get('percent') ?? ''

    if (!symbol) {
      return new Response(JSON.stringify({ error: 'symbol 파라미터가 필요합니다' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const db = createClient(supabaseUrl, supabaseKey)

    const { data: cached } = await db
      .from('stock_why')
      .select('*')
      .eq('symbol', symbol)
      .single()

    if (cached) {
      const age = Date.now() - new Date(cached.updated_at).getTime()
      if (age < CACHE_TTL_MS) {
        return new Response(JSON.stringify({ tag: cached.tag, title: cached.title, summary: cached.summary, bullets: cached.bullets }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        })
      }
    }

    const articles = await fetchNaverNews(name)
    const result = await generateWhy(name, percent, articles)

    await db.from('stock_why').upsert({
      symbol,
      tag: result.tag,
      title: result.title,
      summary: result.summary,
      bullets: result.bullets,
      updated_at: new Date().toISOString(),
    })

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
