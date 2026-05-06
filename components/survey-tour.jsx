import * as React from 'react';
import * as ReactDOM from 'react-dom';

/* Survey modal + Tour */

const SurveyModal = ({ open, onClose, onComplete }) => {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState({0: null, 1: null, 2: []});

  React.useEffect(() => {
    if (open) { setStep(0); setAnswers({0: null, 1: null, 2: []}); }
  }, [open]);

  const q = SURVEY[step];
  const canNext = q.multi ? answers[step].length > 0 : answers[step] !== null;

  const pick = (idx) => {
    if (q.multi) {
      const arr = answers[step];
      const next = arr.includes(idx) ? arr.filter(x => x !== idx) : [...arr, idx];
      setAnswers({...answers, [step]: next});
    } else {
      setAnswers({...answers, [step]: idx});
    }
  };

  const next = () => {
    if (step < SURVEY.length - 1) setStep(step + 1);
    else { onComplete(); onClose(); }
  };

  return (
    <>
      <div className={`overlay ${open ? 'show' : ''}`} onClick={onClose}></div>
      <div className={`modal ${open ? 'show' : ''}`}>
        <div className="modal-head">
          <div>
            <div className="survey-step">투자성향 분석 · {step + 1}/{SURVEY.length}</div>
            <div className="modal-title" style={{marginTop:6}}>3분이면 충분해요</div>
            <div className="modal-sub">답변을 바탕으로 맞춤 분석을 만들어드려요</div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>

        <div className="survey-q">{q.q}</div>

        {q.multi ? (
          <div className="chip-grid">
            {q.opts.map((o, i) => (
              <button key={i}
                className={`chip ${answers[step].includes(i) ? 'on' : ''}`}
                onClick={() => pick(i)}>
                {answers[step].includes(i) && <span className="chip-x">✓</span>}
                {o}
              </button>
            ))}
          </div>
        ) : (
          <div className="survey-opts">
            {q.opts.map((o, i) => (
              <button key={i}
                className={`survey-opt ${answers[step] === i ? 'selected' : ''}`}
                onClick={() => pick(i)}>
                <span className="survey-opt-radio"></span>
                {o}
              </button>
            ))}
          </div>
        )}

        <div className="modal-foot">
          <div className="step-dots">
            {SURVEY.map((_, i) => <div key={i} className={`step-dot ${i === step ? 'active' : ''}`}></div>)}
          </div>
          <div style={{display:'flex', gap:8}}>
            {step > 0 && <button className="btn-ghost" onClick={() => setStep(step - 1)}>이전</button>}
            <button className="btn-primary" onClick={next} disabled={!canNext}
              style={{opacity: canNext ? 1 : 0.5, cursor: canNext ? 'pointer' : 'not-allowed'}}>
              {step === SURVEY.length - 1 ? '분석하기' : '다음'} <Icon name="arrow-right" size={13}/>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* Tour */
const TOUR_STEPS = [
  { sel: '[data-tour="market-summary"]', title: '시장 요약', text: '6개의 핵심 지표를 한눈에 보세요. 카드 위에 마우스를 올리면 "무엇인지 + 왜 중요한지" 설명이 떠요.', pos: 'bottom' },
  { sel: '[data-tour="chart"]', title: '내 종목 차트', text: '관심 종목의 흐름을 차트로 분석하고, "Why?" 버튼으로 등락의 이유를 확인할 수 있어요.', pos: 'right' },
  { sel: '[data-tour="news"]', title: '시장 핵심 뉴스', text: '오늘의 시장에 영향을 주는 뉴스만 큐레이션해 드려요.', pos: 'left' },
  { sel: '[data-tour="watch"]', title: '관심 종목', text: '내가 추가한 종목의 가격과 추세를 미니 차트로 빠르게 확인하세요.', pos: 'left' },
  { sel: '[data-tour="propensity"]', title: '투자성향 분석', text: '간단한 설문과 관심 종목 분석으로 나만의 투자 DNA를 그려드려요.', pos: 'top' },
  { sel: '[data-tour="quiz"]', title: '데일리 퀴즈', text: '매일 짧은 퀴즈로 경제 상식을 키워보세요.', pos: 'top' },
  { sel: '[data-tour="beginner-toggle"]', title: '초보자 모드', text: '언제든지 토글해 화면의 설명 텍스트를 켜고 끌 수 있어요.', pos: 'right' },
];

const Tour = ({ active, step, onNext, onSkip }) => {
  const [box, setBox] = React.useState(null);

  React.useEffect(() => {
    if (!active) return;
    const update = () => {
      const el = document.querySelector(TOUR_STEPS[step].sel);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBox({ x: r.left - 8, y: r.top - 8, w: r.width + 16, h: r.height + 16, ...TOUR_STEPS[step] });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const el = document.querySelector(TOUR_STEPS[step].sel);
    if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'});
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [active, step]);

  if (!active || !box) return null;

  // Position card relative to spotlight
  const vw = window.innerWidth, vh = window.innerHeight;
  let cx, cy;
  const cardW = 320, cardH = 180;
  if (box.pos === 'bottom') { cx = box.x + box.w/2 - cardW/2; cy = box.y + box.h + 12; }
  else if (box.pos === 'top') { cx = box.x + box.w/2 - cardW/2; cy = box.y - cardH - 12; }
  else if (box.pos === 'left') { cx = box.x - cardW - 12; cy = box.y + box.h/2 - cardH/2; }
  else { cx = box.x + box.w + 12; cy = box.y + box.h/2 - cardH/2; }
  cx = Math.max(16, Math.min(cx, vw - cardW - 16));
  cy = Math.max(16, Math.min(cy, vh - cardH - 16));

  return (
    <div className={`tour-overlay ${active ? 'show' : ''}`}>
      <div className="tour-spot" style={{left: box.x, top: box.y, width: box.w, height: box.h}}></div>
      <div className="tour-card" style={{left: cx, top: cy}}>
        <span className="tour-step-label">STEP {step + 1} / {TOUR_STEPS.length}</span>
        <div className="tour-title">{box.title}</div>
        <div className="tour-text">{box.text}</div>
        <div className="tour-foot">
          <button className="tour-skip" onClick={onSkip}>건너뛰기</button>
          <button className="btn-primary" onClick={onNext}>
            {step === TOUR_STEPS.length - 1 ? '시작하기' : '다음'} <Icon name="arrow-right" size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
};

window.SurveyModal = SurveyModal;
window.Tour = Tour;
window.TOUR_STEPS = TOUR_STEPS;
