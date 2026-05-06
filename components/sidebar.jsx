/* Sidebar component */

const Sidebar = ({ active, setActive, beginner, setBeginner, onStartTour, onOpenSurvey }) => {
  const items = [
    { key: 'home', icon: 'home', label: '대시보드' },
    { key: 'portfolio', icon: 'briefcase', label: '포트폴리오' },
    { key: 'watch', icon: 'star', label: '관심 종목', badge: '6' },
    { key: 'news', icon: 'newspaper', label: '뉴스 & 리포트' },
    { key: 'alert', icon: 'bell', label: '알림' },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">투</div>
        <div>
          <div className="brand-name">투자 한입</div>
          <div className="brand-sub">Investing, bite-sized</div>
        </div>
      </div>

      <div className="greet">
        <div className="greet-hi">안녕하세요</div>
        <div className="greet-name">민지님 👋</div>
        <div className="greet-meta">
          <span className="greet-dot"></span>
          오늘도 좋은 하루 되세요
        </div>
      </div>

      <nav className="nav">
        <div className="nav-label">Menu</div>
        {items.map(i => (
          <button key={i.key}
            className={`nav-item ${active === i.key ? 'active' : ''}`}
            onClick={() => setActive(i.key)}>
            <span className="nav-icon"><Icon name={i.icon} size={17}/></span>
            <span>{i.label}</span>
            {i.badge && <span className="nav-badge">{i.badge}</span>}
          </button>
        ))}
      </nav>

      <nav className="nav">
        <div className="nav-label">Tools</div>
        <button className="nav-item" onClick={onOpenSurvey}>
          <span className="nav-icon"><Icon name="sparkles" size={17}/></span>
          <span>투자성향 분석</span>
        </button>
        <button className="nav-item" onClick={onStartTour} data-tour="tour-btn">
          <span className="nav-icon"><Icon name="tour" size={17}/></span>
          <span>가이드 투어</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="beginner-card" data-tour="beginner-toggle">
          <div className="beginner-row">
            <div>
              <div className="beginner-title">Beginner Mode</div>
              <div className="beginner-sub">{beginner ? '쉬운 설명 표시' : '전문가 모드'}</div>
            </div>
            <div className={`toggle ${beginner ? 'on' : ''}`}
              onClick={() => setBeginner(!beginner)}>
              <div className="toggle-knob"></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
