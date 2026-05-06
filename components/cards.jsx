import * as React from 'react';

/* News, Watchlist, Knowledge cards, Quiz */

const NewsCard = ({ beginner }) => (
  <div className="card" data-tour="news">
    <div className="card-head">
      <div className="card-head-left">
        <div className="card-num"><span className="card-num-dot">3</span> 주요 뉴스</div>
        <div className="card-title">시장 핵심 뉴스</div>
        {beginner && <div className="card-sub">시장에 영향을 주는 주요 뉴스를 요약했어요</div>}
      </div>
      <button className="card-action">전체 <Icon name="chevron-right" size={12}/></button>
    </div>
    <div className="news-list">
      {NEWS.map((n, i) => (
        <div key={i} className="news-item">
          <div className="news-thumb">{n.emoji}</div>
          <div className="news-content">
            <span className={`news-tag ${n.tagClass}`}>{n.tag}</span>
            <div className="news-title">{n.title}</div>
            <div className="news-meta">{n.meta}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const WatchlistCard = ({ beginner }) => (
  <div className="card" data-tour="watch">
    <div className="card-head">
      <div className="card-head-left">
        <div className="card-num"><span className="card-num-dot">4</span> 관심 종목</div>
        <div className="card-title">My Watchlist</div>
        {beginner && <div className="card-sub">관심 종목의 가격/등락을 한눈에</div>}
      </div>
      <button className="card-action"><Icon name="plus" size={14}/></button>
    </div>
    <div className="watch-list">
      {WATCHLIST.map((w, i) => {
        const data = series(w.sparkSeed, 18, 1);
        return (
          <div key={i} className="watch-item">
            <div className="watch-icon">{w.symbol.slice(0, 2)}</div>
            <div className="watch-info">
              <div className="watch-name">{w.name}</div>
              <div className="watch-symbol">{w.symbol}</div>
            </div>
            <div className="watch-spark">
              <Sparkline data={data} color={w.up ? '#d4453a' : '#1e8a5b'} width={50} height={24}/>
            </div>
            <div className="watch-price">
              <div className="watch-price-val">{w.price}</div>
              <div className={`watch-price-chg ${w.up ? 'up' : 'down'}`}>{w.chg}</div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const PropensityCard = ({ beginner, hasResult, openSurvey, whyKey, setWhyKey }) => {
  const traits = [
    { label: '안정 추구', val: 78, point: true },
    { label: '장기 투자', val: 64, point: false },
    { label: '리스크 감내', val: 32, point: false },
    { label: '학습 의지', val: 86, point: true },
  ];
  return (
    <div className="card" data-tour="propensity">
      <div className="card-head">
        <div className="card-head-left">
          <div className="card-num"><span className="card-num-dot">5</span> 유저 투자성향</div>
          <div className="card-title">나의 투자 DNA</div>
          {beginner && <div className="card-sub">관심 종목과 설문을 바탕으로 분석했어요</div>}
        </div>
        <div style={{position:'relative'}}>
          <button className="why-btn" onClick={() => setWhyKey(whyKey === 'prop' ? null : 'prop')}>
            <span className="q">?</span> Why?
          </button>
          <div className={`why-pop ${whyKey === 'prop' ? 'show' : ''}`}>
            <span className="why-pop-tag">분석 근거</span>
            <div className="why-pop-title">왜 "안정 성장형"으로 분류됐을까?</div>
            <div className="why-pop-text">설문 응답과 관심 종목 6개의 변동성·섹터 분포를 종합해 산출했어요.</div>
            <div className="why-pop-list">
              <div className="why-pop-li">관심 종목 중 4/6이 대형 우량주</div>
              <div className="why-pop-li">설문에서 "장기 보유" 선택</div>
              <div className="why-pop-li">손실 시 "추이 관찰" 응답</div>
            </div>
          </div>
        </div>
      </div>

      {hasResult ? (
        <>
          <div className="propensity">
            <div className="donut-wrap">
              <svg viewBox="0 0 120 120" width="130" height="130">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#f7f6f4" strokeWidth="14"/>
                <circle cx="60" cy="60" r="48" fill="none" stroke="#facc18" strokeWidth="14"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - 0.72)}`}
                  transform="rotate(-90 60 60)" strokeLinecap="round"/>
              </svg>
              <div className="donut-center">
                <div className="donut-type">안정 성장형</div>
                <div className="donut-score">스코어 72</div>
              </div>
            </div>
            <div className="propensity-list">
              {traits.map((t, i) => (
                <div key={i} className="propensity-row">
                  <div className="propensity-label">{t.label}</div>
                  <div className="propensity-bar">
                    <div className={`propensity-bar-fill ${t.point ? 'point' : ''}`} style={{width:`${t.val}%`}}></div>
                  </div>
                  <div className="propensity-val">{t.val}</div>
                </div>
              ))}
            </div>
          </div>
          <button className="btn-ghost propensity-cta" onClick={openSurvey}>
            설문 다시하기 <Icon name="arrow-right" size={12}/>
          </button>
        </>
      ) : (
        <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'flex-start', justifyContent:'center', gap:10, padding:'16px 0'}}>
          <div style={{fontSize:13, color:'var(--ink)', lineHeight:1.6}}>
            3분 설문으로 나의 투자 성향을 분석하고<br/>맞춤 종목을 추천받아 보세요.
          </div>
          <button className="btn-primary" onClick={openSurvey}>
            <Icon name="sparkles" size={14}/> 분석 시작하기
          </button>
        </div>
      )}
    </div>
  );
};

const KnowledgeCard = ({ beginner }) => (
  <div className="card" data-tour="know">
    <div className="card-head">
      <div className="card-head-left">
        <div className="card-num"><span className="card-num-dot">6</span> 투자 상식 카드</div>
        <div className="card-title">오늘의 한 입 지식</div>
        {beginner && <div className="card-sub">매일 바뀌는 간단 상식 카드</div>}
      </div>
      <button className="card-action"><Icon name="chevron-right" size={12}/></button>
    </div>
    <div className="know-cards">
      {KNOW_CARDS.map((k, i) => (
        <div key={i} className={`know-mini ${k.tone}`}>
          <div className="know-mini-num">{k.num}</div>
          <div className="know-mini-title">{k.title}</div>
        </div>
      ))}
    </div>
    <div className="know-feature">
      <div className="know-feature-tag">★ Today's Pick</div>
      <div className="know-feature-title">복리의 마법: 72의 법칙</div>
      <div className="know-feature-desc">72를 연 수익률로 나누면 원금이 두 배가 되는 햇수가 나와요. 7%면 약 10년!</div>
    </div>
  </div>
);

const QuizCard = ({ beginner }) => {
  const [picked, setPicked] = React.useState(null);
  const isAnswered = picked !== null;
  return (
    <div className="card" data-tour="quiz">
      <div className="card-head">
        <div className="card-head-left">
          <div className="card-num"><span className="card-num-dot">7</span> 투자 기초 퀴즈</div>
          <div className="card-title">데일리 챌린지</div>
          {beginner && <div className="card-sub">짧은 퀴즈로 경제 지식을 늘려보세요</div>}
        </div>
        <span className="quiz-tag"><Icon name="fire" size={11}/> Day 3</span>
      </div>
      <div className="quiz-q">{QUIZ.question}</div>
      <div className="quiz-options">
        {QUIZ.options.map((o, i) => {
          let cls = 'quiz-opt';
          if (isAnswered) {
            if (o.correct) cls += ' correct';
            else if (i === picked) cls += ' wrong';
          }
          return (
            <button key={i} className={cls} onClick={() => !isAnswered && setPicked(i)}>
              <span className="quiz-opt-letter">{o.letter}</span>
              {o.text}
            </button>
          );
        })}
      </div>
      <div className="quiz-progress">
        <span>오늘 진행</span>
        <div className="quiz-progress-track">
          <div className="quiz-progress-fill" style={{width: `${QUIZ.progress / QUIZ.total * 100}%`}}></div>
        </div>
        <span>{QUIZ.progress}/{QUIZ.total}</span>
      </div>
    </div>
  );
};

window.NewsCard = NewsCard;
window.WatchlistCard = WatchlistCard;
window.PropensityCard = PropensityCard;
window.KnowledgeCard = KnowledgeCard;
window.QuizCard = QuizCard;
