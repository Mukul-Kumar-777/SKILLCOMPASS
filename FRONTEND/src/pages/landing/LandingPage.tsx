import { useEffect, useState, type CSSProperties } from 'react';
import { navigate } from '../../router/appRouter';
import { SvgIcon } from '../../components/icons/SvgIcon';
import './landing.css';

const skills = [
  { name: 'TypeScript', mark: 'TS', score: 92, tone: 'cyan' },
  { name: 'React', mark: 'R', score: 88, tone: 'blue' },
  { name: 'Node.js', mark: 'N', score: 84, tone: 'purple' },
  { name: 'PostgreSQL', mark: 'PG', score: 76, tone: 'mint' },
];

const stats = [
  { value: '01', label: 'Connect', detail: 'Your real projects' },
  { value: '02', label: 'Understand', detail: 'Your technical skills' },
  { value: '03', label: 'Discover', detail: 'Your career direction' },
];

function Logo() {
  return (
    <button className="lp-logo" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <span className="lp-logo-mark" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <defs>
            <linearGradient id="lp-logo-gradient" x1="5" y1="5" x2="29" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D7F7FF" />
              <stop offset=".4" stopColor="#5DE5FF" />
              <stop offset="1" stopColor="#735CFF" />
            </linearGradient>
          </defs>
          <path d="M17 2.5 21 13l10.5 4-10.5 4L17 31.5 13 21 2.5 17 13 13 17 2.5Z" fill="url(#lp-logo-gradient)" />
          <circle cx="17" cy="17" r="2.6" fill="#FFF" />
        </svg>
      </span>
      <span className="lp-logo-copy">
        <strong>SkillCompass</strong>
        <small>Your Code. A Brighter Tomorrow.</small>
      </span>
    </button>
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSkill((value) => (value + 1) % skills.length), 1900);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="landing-page">
      <div className="lp-noise" aria-hidden="true" />
      <div className="lp-grid" aria-hidden="true" />
      <div className="lp-glow lp-glow-a" aria-hidden="true" />
      <div className="lp-glow lp-glow-b" aria-hidden="true" />
      <div className="lp-glow lp-glow-c" aria-hidden="true" />
      <div className="lp-orbit lp-orbit-a" aria-hidden="true" />
      <div className="lp-orbit lp-orbit-b" aria-hidden="true" />
      <div className="lp-particles" aria-hidden="true">
        {Array.from({ length: 26 }, (_, index) => <i key={index} style={{ '--i': index } as CSSProperties} />)}
      </div>

      <header className="lp-nav">
        <div className="lp-nav-inner">
          <Logo />

          <nav className={`lp-links ${menuOpen ? 'open' : ''}`} aria-label="Landing page navigation">
            <button type="button" onClick={() => { scrollToId('features'); setMenuOpen(false); }}>Features</button>
            <button type="button" onClick={() => { scrollToId('how-it-works'); setMenuOpen(false); }}>How It Works</button>
            <button type="button" onClick={() => { scrollToId('why-skillcompass'); setMenuOpen(false); }}>Why SkillCompass</button>
          </nav>

          <div className="lp-nav-actions">
            <button className="lp-signin" type="button" onClick={() => navigate('/')}>Sign In</button>
            <button className="lp-nav-cta" type="button" onClick={() => navigate('/github')}>
              Get Started <SvgIcon name="arrow" size={18} />
            </button>
          </div>

          <button className="lp-menu" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      <section className="lp-hero" aria-labelledby="landing-title">
        <div className="lp-hero-copy">
          <div className="lp-eyebrow"><span className="lp-eyebrow-dot" /> AI-POWERED CAREER INTELLIGENCE</div>
          <h1 id="landing-title">
            Your code already knows
            <span> what you’re capable of.</span>
          </h1>
          <p className="lp-hero-text">
            SkillCompass reads the projects you build, extracts the skills behind them,
            measures your technical profile, and connects that evidence to real career paths.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-primary" type="button" onClick={() => navigate('/github')}>
              Analyze My GitHub <SvgIcon name="arrow" size={20} />
            </button>
            <button className="lp-secondary" type="button" onClick={() => scrollToId('how-it-works')}>
              <span className="lp-play"><SvgIcon name="play" size={13} /></span>
              See How It Works
            </button>
          </div>

          <div className="lp-proof-row">
            <div><strong>GitHub</strong><span>Real project evidence</span></div>
            <i />
            <div><strong>AI</strong><span>Skill intelligence</span></div>
            <i />
            <div><strong>Career</strong><span>Role discovery</span></div>
          </div>
        </div>

        <div className="lp-visual-wrap" aria-label="Live SkillCompass intelligence preview">
          <div className="lp-visual-orbit orbit-one" />
          <div className="lp-visual-orbit orbit-two" />
          <div className="lp-visual-halo" />

          <div className="lp-floating-chip chip-top"><span className="chip-dot cyan" /> Skill Intelligence <b>LIVE</b></div>
          <div className="lp-floating-chip chip-bottom"><SvgIcon name="target" size={17} /> 3 roles matched</div>

          <div className="lp-dashboard-card">
            <div className="lp-card-topline">
              <div><span className="lp-live-dot" /> LIVE ANALYSIS</div>
              <span>SKILLCOMPASS / 01</span>
            </div>

            <div className="lp-profile-row">
              <div className="lp-avatar">SC</div>
              <div className="lp-profile-copy"><strong>Developer Skill Profile</strong><span>Evidence collected from your code</span></div>
              <div className="lp-profile-score"><strong>87</strong><span>profile</span></div>
            </div>

            <div className="lp-insight-strip">
              <div><span>Detected Stack</span><strong>Full-Stack</strong></div>
              <div><span>Skill Signals</span><strong>24 found</strong></div>
              <div><span>Career Fit</span><strong>High</strong></div>
            </div>

            <div className="lp-chart-title"><span>Skill confidence</span><strong>+18.4%</strong></div>
            <div className="lp-chart">
              <div className="lp-chart-grid" />
              <svg viewBox="0 0 500 160" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="lp-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#62e8ff" stopOpacity=".34" />
                    <stop offset="1" stopColor="#62e8ff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 132 C38 126 55 108 92 115 S142 92 178 101 S224 56 260 75 S314 67 348 72 S399 42 438 50 S475 24 500 33 V160 H0 Z" fill="url(#lp-area)" />
                <path d="M0 132 C38 126 55 108 92 115 S142 92 178 101 S224 56 260 75 S314 67 348 72 S399 42 438 50 S475 24 500 33" fill="none" stroke="#62e8ff" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                <circle cx="438" cy="50" r="6" fill="#62e8ff" />
                <circle cx="438" cy="50" r="13" fill="#62e8ff" opacity=".13" />
              </svg>
            </div>

            <div className="lp-skill-heading"><span>Top detected skills</span><span>Confidence</span></div>
            <div className="lp-skill-list">
              {skills.map((skill, index) => (
                <div className={`lp-skill ${activeSkill === index ? 'active' : ''}`} key={skill.name}>
                  <span className={`lp-skill-mark ${skill.tone}`}>{skill.mark}</span>
                  <span className="lp-skill-name">{skill.name}</span>
                  <span className="lp-skill-track"><i style={{ width: `${skill.score}%` }} /></span>
                  <strong>{skill.score}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-metric-band" aria-label="SkillCompass workflow">
        {stats.map((stat) => (
          <div key={stat.value} className="lp-metric">
            <strong>{stat.value}</strong>
            <div><span>{stat.label}</span><small>{stat.detail}</small></div>
          </div>
        ))}
        <div className="lp-metric-end"><SvgIcon name="sparkle" size={22} /><span>Built from the work you already do.</span></div>
      </section>

      <section className="lp-feature-section" id="features">
        <div className="lp-section-heading">
          <span className="lp-kicker">ONE WORKSPACE. DEEPER SIGNAL.</span>
          <h2>Stop guessing what your skills are worth.</h2>
          <p>SkillCompass turns scattered repository activity into a visual technical profile you can actually use.</p>
        </div>

        <div className="lp-feature-grid">
          <article className="lp-feature-card feature-large">
            <div className="feature-number">01</div>
            <div className="feature-icon"><SvgIcon name="code" size={27} /></div>
            <h3>Understand your real stack.</h3>
            <p>See the languages, frameworks, databases, patterns, and project evidence hiding inside your repositories.</p>
            <div className="mini-stack"><span>TypeScript</span><span>React</span><span>Node.js</span><span>PostgreSQL</span></div>
          </article>

          <article className="lp-feature-card feature-accent">
            <div className="feature-number">02</div>
            <div className="feature-icon"><SvgIcon name="chart" size={27} /></div>
            <h3>Measure proficiency.</h3>
            <p>Turn project evidence into confidence signals instead of relying on a list of technologies you have touched.</p>
            <div className="radial-score"><strong>87</strong><span>/ 100</span></div>
          </article>

          <article className="lp-feature-card feature-wide">
            <div className="feature-number">03</div>
            <div className="feature-icon"><SvgIcon name="target" size={27} /></div>
            <div className="feature-wide-copy"><h3>Find where your skills can take you.</h3><p>Explore role profiles that connect your current capabilities with the technical skills employers are asking for.</p></div>
            <div className="role-pills"><span>Frontend Engineer <b>92%</b></span><span>Full-Stack Developer <b>89%</b></span><span>Backend Engineer <b>84%</b></span></div>
          </article>
        </div>
      </section>

      <section className="lp-workflow" id="how-it-works">
        <div className="lp-section-heading centered">
          <span className="lp-kicker">HOW IT WORKS</span>
          <h2>From repository to direction.</h2>
          <p>No empty questionnaires. No guessing. Start with the work you have already created.</p>
        </div>

        <div className="lp-flow-line" aria-hidden="true" />
        <div className="lp-steps">
          <article><span className="step-index">01</span><div className="step-icon"><SvgIcon name="github" size={28} /></div><h3>Connect GitHub</h3><p>Bring your repositories into your SkillCompass workspace.</p></article>
          <article><span className="step-index">02</span><div className="step-icon"><SvgIcon name="sparkle" size={28} /></div><h3>Let AI understand</h3><p>Analyze project evidence and extract meaningful technical signals.</p></article>
          <article><span className="step-index">03</span><div className="step-icon"><SvgIcon name="target" size={28} /></div><h3>Explore your path</h3><p>Connect your profile with roles, strengths, and skill gaps.</p></article>
        </div>
      </section>

      <section className="lp-final" id="why-skillcompass">
        <div className="final-orb" aria-hidden="true" />
        <div className="lp-final-copy"><span className="lp-kicker">YOUR CODE IS THE EVIDENCE</span><h2>Build with purpose.<br /><span>Navigate with intelligence.</span></h2><p>Start with GitHub and see what SkillCompass can discover about the developer you are becoming.</p></div>
        <button className="lp-primary lp-final-cta" type="button" onClick={() => navigate('/github')}>Start with GitHub <SvgIcon name="arrow" size={20} /></button>
      </section>

      <footer className="lp-footer"><Logo /><span>SkillCompass · AI Career Intelligence</span></footer>
    </main>
  );
}
