import { PROPENSITY_QUESTIONS } from '../constants'

export default function SurveyModal({
  open,
  step,
  answers,
  onPick,
  onPrev,
  onNext,
  onClose,
}: {
  open: boolean
  step: number
  answers: number[]
  onPick: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}) {
  const question = PROPENSITY_QUESTIONS[step]
  const canNext = answers[step] !== undefined

  if (!open) return null

  return (
    <>
      <div className="overlay show" onClick={onClose} />
      <div className="modal show">
        <div className="modal-head">
          <div>
            <div className="survey-step">투자 성향 분석 · {step + 1}/{PROPENSITY_QUESTIONS.length}</div>
            <div className="modal-title" style={{ marginTop: 6 }}>나에게 맞는 투자 스타일을 찾아볼게요</div>
            <div className="modal-sub">짧은 질문 4개로 성향을 계산합니다</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="survey-q">{question.q}</div>

        <div className="survey-opts">
          {question.opts.map((option, index) => (
            <button
              key={option}
              className={`survey-opt ${answers[step] === index ? 'selected' : ''}`}
              onClick={() => onPick(index)}
            >
              <span className="survey-opt-radio" />
              {option}
            </button>
          ))}
        </div>

        <div className="modal-foot">
          <div className="step-dots">
            {PROPENSITY_QUESTIONS.map((_, index) => (
              <div key={index} className={`step-dot ${index === step ? 'active' : ''}`} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && <button className="btn-ghost" onClick={onPrev}>이전</button>}
            <button className="btn-primary" onClick={onNext} disabled={!canNext} style={{ opacity: canNext ? 1 : 0.5, cursor: canNext ? 'pointer' : 'not-allowed' }}>
              {step === PROPENSITY_QUESTIONS.length - 1 ? '분석하기' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
