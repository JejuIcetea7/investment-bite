import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type SurveyAnswer = {
  question: string
  answer: string
  answerIndex: number
}

type PropensityPayload = {
  result: {
    title: string
    badge: string
    score: number
    summary: string
    note: string
  }
  answers: SurveyAnswer[]
}

function fallback(payload: PropensityPayload) {
  return {
    llmSummary: payload.result.summary,
    strengths: [
      '설문 답변 기준으로 투자 기간, 하락 대응, 선호 스타일이 비교적 일관되게 나타납니다. 투자 결정을 할 때 감정적으로 움직이기보다 본인이 선택한 기준을 중심으로 판단하려는 경향이 있습니다.',
    ],
    cautions: [
      `${payload.result.note} 특히 시장 분위기만 보고 판단하면 원래 성향과 다른 결정을 할 수 있으니, 매수 전에는 기간과 손실 허용 범위를 먼저 정하는 편이 좋습니다.`,
    ],
    recommendation: `${payload.result.note} 처음에는 한 번에 크게 들어가기보다 작은 금액으로 기준을 점검하면서 본인에게 맞는 투자 리듬을 찾는 것을 추천합니다.`,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST 요청만 지원합니다' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    const payload = await req.json() as PropensityPayload

    if (!apiKey) {
      return new Response(JSON.stringify(fallback(payload)), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const answerText = payload.answers
      .map((item, index) => `${index + 1}. ${item.question}\n- 선택: ${item.answer}`)
      .join('\n\n')

    const prompt = `너는 초보 투자자를 돕는 투자 성향 분석 도우미다.
투자 조언은 참고용으로만 표현하고, 특정 종목 매수/매도 지시는 하지 않는다.
아래 설문 결과를 바탕으로 사용자의 투자 성향을 쉬운 한국어로 설명하라.

룰베이스 분류:
- 성향명: ${payload.result.title}
- 배지: ${payload.result.badge}
- 점수: ${payload.result.score}
- 기본 요약: ${payload.result.summary}
- 기본 주의 문구: ${payload.result.note}

설문 답변:
${answerText}

작성 규칙:
- 같은 설문 답변 조합에는 항상 같은 분석이 나오도록 임의 표현을 줄이고, 제공된 답변 근거만 사용한다.
- llmSummary는 2~3개의 짧은 문장으로 작성한다. 화면에서는 불렛으로 표시된다.
- strengths, cautions, recommendation은 각각 줄글로 읽혔을 때 약 2줄 분량이 되도록 2문장으로 작성한다.
- strengths와 cautions는 배열이지만 각 배열에는 긴 문장 1개만 넣는다.
- recommendation은 문자열 하나로 작성한다.
- 투자 조언은 참고용으로만 표현하고, 특정 종목 매수/매도 지시는 하지 않는다.

JSON 객체만 응답하라. 형식:
{
  "llmSummary": "2~3문장 설명",
  "strengths": ["투자 특징을 2문장 줄글로 설명"],
  "cautions": ["주의할 점을 2문장 줄글로 설명"],
  "recommendation": "초보자가 이해하기 쉬운 2문장 조언"
}`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      return new Response(JSON.stringify(fallback(payload)), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)

    return new Response(JSON.stringify({
      llmSummary: typeof parsed.llmSummary === 'string' ? parsed.llmSummary : payload.result.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : fallback(payload).strengths,
      cautions: Array.isArray(parsed.cautions) ? parsed.cautions.slice(0, 2) : fallback(payload).cautions,
      recommendation: typeof parsed.recommendation === 'string' ? parsed.recommendation : payload.result.note,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
