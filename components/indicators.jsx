import * as React from 'react';
import * as ReactDOM from 'react-dom';

/* Indicators row + chart card */

const IndicatorCard = ({ ind, beginner }) => {
  const [show, setShow] = React.useState(false);
  const [pos, setPos] = React.useState({x: 0, y: 0, w: 0});
  const ref = React.useRef(null);
  const sparkData = series(ind.label.charCodeAt(0) + ind.label.charCodeAt(1), 18, 1);

  const onEnter = () => {
    if (!beginner) return;
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2, y: r.bottom + 10, w: r.width });
    }
    setShow(true);
  };

  const onMove = (event) => {
    if (!beginner || !show) return;
    setPos({ x: event.clientX, y: event.clientY + 14, w: pos.w });
  };

  return (
    <div className="indicator" ref={ref}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={() => setShow(false)}
      style={{cursor: beginner ? 'help' : 'default'}}>
      <div className="indicator-label">
        {ind.label}
        {beginner && <span className="indicator-info">i</span>}
      </div>
      <div className="indicator-value">
        {ind.unit === '$' ? '$' : ''}{ind.value}
      </div>
      <div className={`indicator-change ${ind.up ? 'up' : 'down'}`}>
        <Icon name={ind.up ? 'arrow-up' : 'arrow-down'} size={11} stroke={2.4}/>
        {ind.change} ({ind.pct})
      </div>
      <div className="indicator-spark">
        <Sparkline data={sparkData} color={ind.up ? '#d4453a' : '#1e8a5b'} width={56} height={20}/>
      </div>
      {show && ReactDOM.createPortal(
        <div className="tooltip-fixed show" style={{left: pos.x, top: pos.y, zIndex: 999}}>
          <div className="tooltip-label">What it is</div>
          <div className="tooltip-title">{ind.label}</div>
          <div>{ind.desc}</div>
          <div className="tooltip-why">
            <strong style={{color:'var(--point)'}}>왜 중요할까?</strong><br/>
            {ind.why}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const IndicatorsRow = ({ beginner }) => {
  const PER_PAGE = 6;
  const pages = Math.ceil(INDICATORS.length / PER_PAGE);
  const [page, setPage] = React.useState(0);
  const trackRef = React.useRef(null);

  const goTo = (p) => {
    const np = Math.max(0, Math.min(pages - 1, p));
    setPage(np);
    if (trackRef.current) {
      trackRef.current.scrollTo({ left: np * trackRef.current.clientWidth, behavior: 'smooth' });
    }
  };

  const onScroll = () => {
    if (!trackRef.current) return;
    const w = trackRef.current.clientWidth;
    const p = Math.round(trackRef.current.scrollLeft / w);
    if (p !== page) setPage(p);
  };

  return (
    <div className="indicators" data-tour="market-summary">
      <div className="card-head">
        <div className="card-head-left">
          <div className="card-num"><span className="card-num-dot">1</span> SECTION 01</div>
          <div className="card-title">시장 요약 영역</div>
          {beginner && <div className="card-sub">주요 지수와 시장 흐름을 한눈에 확인하세요. 카드 위에 마우스를 올리면 설명이 나타나요.</div>}
        </div>
        <div className="ind-pager-controls">
          <button className="ind-arrow" onClick={() => goTo(page - 1)} disabled={page === 0} aria-label="이전">
            <Icon name="chevron-right" size={14}/>
          </button>
          <button className="ind-arrow" onClick={() => goTo(page + 1)} disabled={page === pages - 1} aria-label="다음">
            <Icon name="chevron-right" size={14}/>
          </button>
        </div>
      </div>
      <div className="indicators-track" ref={trackRef} onScroll={onScroll}>
        {Array.from({length: pages}).map((_, p) => (
          <div key={p} className="indicators-page">
            {INDICATORS.slice(p * PER_PAGE, (p + 1) * PER_PAGE).map(i => (
              <IndicatorCard key={i.key} ind={i} beginner={beginner}/>
            ))}
          </div>
        ))}
      </div>
      <div className="ind-pager-foot">
        <div className="ind-page-count">
          <span className="ind-page-num">{String(page + 1).padStart(2, '0')}</span>
          <span className="ind-page-sep">/</span>
          <span className="ind-page-total">{String(pages).padStart(2, '0')}</span>
          <span className="ind-page-label">페이지</span>
        </div>
        <div className="ind-dots">
          {Array.from({length: pages}).map((_, p) => (
            <button key={p} className={`ind-dot ${p === page ? 'active' : ''}`} onClick={() => goTo(p)} aria-label={`페이지 ${p+1}`}/>
          ))}
        </div>
      </div>
    </div>
  );
};

/* SVG line chart */
const ChartArea = () => {
  const W = 720, H = 220, PAD = 4;
  const data = React.useMemo(() => {
    const pts = []; let v = 50; let s = 99;
    for (let i = 0; i < 60; i++) {
      s = (s * 9301 + 49297) % 233280;
      v += ((s/233280) - 0.48) * 4;
      pts.push(v);
    }
    return pts;
  }, []);
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min;
  const points = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return [x, y];
  });
  const d = points.map((p, i) => i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`).join(' ');
  const fillD = `${d} L${W-PAD},${H-PAD} L${PAD},${H-PAD} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{width:'100%', height:'100%'}}>
      <defs>
        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#facc18" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#facc18" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Grid */}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line key={i} x1={PAD} x2={W-PAD} y1={H*p} y2={H*p} stroke="#ece9e2" strokeDasharray="3 4"/>
      ))}
      <path d={fillD} fill="url(#chartGrad)"/>
      <path d={d} stroke="#3a2204" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Last point dot */}
      <circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r="5" fill="#facc18" stroke="#3a2204" strokeWidth="2"/>
      {/* Annotation */}
      <g transform={`translate(${points[points.length-1][0]-90}, ${points[points.length-1][1]-32})`}>
        <rect x="0" y="0" width="80" height="22" rx="6" fill="#3a2204"/>
        <text x="40" y="15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#facc18">현재 72,400</text>
      </g>
    </svg>
  );
};

const STAT_INFO = {
  '거래량': {
    title: '거래량 (Volume)',
    desc: '하루 동안 사고팔린 주식 수예요. 거래량이 많을수록 시장 관심이 크고, 갑자기 늘어나면 중요한 이슈가 있다는 신호일 수 있어요.'
  },
  '시가총액': {
    title: '시가총액 (Market Cap)',
    desc: '주가 × 발행주식수. 회사의 "덩치"를 나타내요. 432조면 한국의 초대형주 그룹이에요.'
  },
  'PER': {
    title: 'PER (주가수익비율)',
    desc: '주가 ÷ 주당순이익. 1년 이익의 몇 배에 거래되는지 보여줘요. 낮으면 저평가, 높으면 미래 성장 기대가 큰 편이에요.'
  },
  '52주 변동': {
    title: '52주 변동폭 (52-Week Range)',
    desc: '지난 1년간의 최저가~최고가. 현재 주가가 어디에 위치해 있는지 가늠하는 척도예요.'
  },
};

const StatItem = ({ label, value, beginner }) => {
  const [show, setShow] = React.useState(false);
  const [pos, setPos] = React.useState({x:0, y:0});
  const ref = React.useRef(null);
  const info = STAT_INFO[label];

  const onEnter = () => {
    if (!beginner || !info) return;
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2, y: r.top - 10 });
    }
    setShow(true);
  };

  const onMove = (event) => {
    if (!beginner || !show) return;
    setPos({ x: event.clientX, y: event.clientY - 14 });
  };

  return (
    <div ref={ref} className={`chart-stat ${beginner ? 'has-help' : ''}`}
      onMouseEnter={onEnter} onMouseMove={onMove} onMouseLeave={() => setShow(false)}>
      <div className="chart-stat-label">
        {label}
        {beginner && info && <span className="stat-info-dot">i</span>}
      </div>
      <div className="chart-stat-value">{value}</div>
      {show && info && ReactDOM.createPortal(
        <div className="tooltip-fixed tooltip-up show" style={{left: pos.x, top: pos.y, zIndex: 999}}>
          <div className="tooltip-label">What it is</div>
          <div className="tooltip-title">{info.title}</div>
          <div>{info.desc}</div>
        </div>,
        document.body
      )}
    </div>
  );
};

const ChartCard = ({ beginner, openWhy, whyKey, setWhyKey }) => {
  const [tab, setTab] = React.useState('1D');
  return (
    <div className="card chart-card" data-tour="chart">
      <div className="card-head">
        <div className="card-head-left">
          <div className="card-num"><span className="card-num-dot">2</span> 내가 보고있는 종목</div>
          <div className="card-title">삼성전자 차트 분석</div>
          {beginner && <div className="card-sub">주요 지수와 자산의 시간 흐름을 비교 차트로 확인할 수 있어요</div>}
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center', position:'relative'}}>
          <div style={{position:'relative'}}>
            <button className="why-btn" onClick={() => setWhyKey(whyKey === 'chart' ? null : 'chart')}>
              <span className="q">?</span> Why?
            </button>
            <div className={`why-pop ${whyKey === 'chart' ? 'show' : ''}`}>
              <span className="why-pop-tag">왜 올랐을까?</span>
              <div className="why-pop-title">삼성전자 +1.83% 상승</div>
              <div className="why-pop-text">HBM3E 양산 본격화 소식과 외국계 IB의 목표가 상향이 동시에 작용했습니다.</div>
              <div className="why-pop-list">
                <div className="why-pop-li">HBM3E 12단 적층 양산 발표</div>
                <div className="why-pop-li">모건스탠리 목표가 95,000원 → 105,000원</div>
                <div className="why-pop-li">외국인 5거래일 연속 순매수</div>
              </div>
            </div>
          </div>
          <div className="chart-tabs">
            {['1D', '1W', '1M', '3M', '1Y'].map(t => (
              <button key={t} className={`chart-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-stock-row">
        <div>
          <div className="chart-symbol">005930 · KOSPI</div>
          <div className="chart-name">삼성전자</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div className="chart-price">72,400 <span style={{fontSize:14, color:'var(--muted)', fontWeight:500}}>KRW</span></div>
          <div className="chart-delta">+1,300 (+1.83%) ▲ 오늘</div>
        </div>
      </div>

      <div className="chart-area"><ChartArea/></div>

      <div className="chart-stats">
        <StatItem label="거래량" value="14.2M" beginner={beginner}/>
        <StatItem label="시가총액" value="432조" beginner={beginner}/>
        <StatItem label="PER" value="14.8x" beginner={beginner}/>
        <StatItem label="52주 변동" value="68,000–86,500" beginner={beginner}/>
      </div>
    </div>
  );
};

window.IndicatorsRow = IndicatorsRow;
window.ChartCard = ChartCard;
