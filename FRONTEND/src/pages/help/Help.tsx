import { useState } from 'react';
import { navigate } from '../../router/appRouter';
import { SvgIcon } from '../../components/icons/SvgIcon';

type HelpTopic = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

const topics: HelpTopic[] = [
  {
    id: 'overview',
    title: 'What is SkillCompass?',
    description:
      'SkillCompass turns your development activity into a technical skill profile, career directions, and job-opening recommendations.',
    icon: 'home',
  },
  {
    id: 'github',
    title: 'How does GitHub work?',
    description:
      'Connect GitHub, sync your repositories, and use the synchronized repository data as the source for repository analysis.',
    icon: 'github',
  },
  {
    id: 'analysis',
    title: 'What does Analysis do?',
    description:
      'Analysis examines repository evidence to identify technologies, skills, and proficiency signals, while keeping each run as historical context.',
    icon: 'chart',
  },
  {
    id: 'skills',
    title: 'How are my skills determined?',
    description:
      'Your current skill profile comes from persisted skills and proficiency updated by analysis. It is not manually maintained from this page.',
    icon: 'layers',
  },
  {
    id: 'job-profiles',
    title: 'What are Job Profiles?',
    description:
      'Job Profiles help you discover career directions that align with your current cumulative skills and show role-level development areas.',
    icon: 'briefcase',
  },
  {
    id: 'recommendations',
    title: 'What are Recommendations?',
    description:
      'Recommendations compares your current skills and proficiency against actual synchronized job openings and surfaces opening-specific gaps.',
    icon: 'target',
  },
];

const faqs = [
  {
    question: 'Do Job Profiles require a specific analysis run?',
    answer:
      'No. Job Profiles use your current cumulative skill profile. Analysis creates or updates that profile, while the analysis history remains historical.',
  },
  {
    question: 'Do Job Recommendations require an analysis ID?',
    answer:
      'No. Recommendations use your current persisted skills and current proficiency when comparing you against actual job openings.',
  },
  {
    question: 'Why do my skills change after another repository analysis?',
    answer:
      'A new analysis can update the current skill and proficiency state when new evidence is found. Earlier analysis runs remain available as historical records.',
  },
  {
    question: 'What is the difference between a role gap and a job gap?',
    answer:
      'A role gap describes skills to explore for a career direction. A job gap is specific to one real opening and is shown on the Recommendations flow.',
  },
  {
    question: 'What should I do first?',
    answer:
      'Connect GitHub, sync your repositories, run analysis, review your current skills, explore Job Profiles, and then open Recommendations for a career direction.',
  },
];

export default function Help() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const normalizedSearch = search.trim().toLowerCase();

  const visibleTopics = topics.filter(topic => {
    if (!normalizedSearch) return true;

    return (
      topic.title.toLowerCase().includes(normalizedSearch) ||
      topic.description.toLowerCase().includes(normalizedSearch)
    );
  });

  const visibleFaqs = faqs.filter(item => {
    if (!normalizedSearch) return true;

    return (
      item.question.toLowerCase().includes(normalizedSearch) ||
      item.answer.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <main className="sc-help-page">
      <style>{` 
        .sc-help-page {
          --sc-help-bg: #050d20;
          --sc-help-card: linear-gradient(145deg, rgba(20, 50, 96, .96), rgba(8, 27, 58, .985));
          --sc-help-card-soft: linear-gradient(145deg, rgba(24, 60, 112, .86), rgba(10, 31, 64, .94));
          --sc-help-line: rgba(112, 176, 255, .18);
          --sc-help-white: #f6f9ff;
          --sc-help-copy: #c6ddf5;
          --sc-help-copy-strong: #d9ebff;
          --sc-help-blue: #63b7ff;
          --sc-help-cyan: #62e8ff;
          --sc-help-purple: #c39aff;
          --sc-help-mint: #61e6b4;
          min-height: 100%;
          width: 100%;
          padding: 30px 34px 54px;
          box-sizing: border-box;
          color: var(--sc-help-white);
          background: transparent;
          font-size: 15px;
        }

        .sc-help-page,
        .sc-help-page * {
          box-sizing: border-box;
        }

        .sc-help-page button,
        .sc-help-page input {
          font: inherit;
        }

        .sc-help-shell {
          width: min(1240px, 100%);
          margin: 0 auto;
        }

        .sc-help-hero,
        .sc-help-panel {
          border: 1px solid var(--sc-help-line);
          background:
            radial-gradient(circle at 88% 8%, rgba(98, 232, 255, .075), transparent 28%),
            var(--sc-help-card);
          box-shadow: 0 19px 34px rgba(0, 7, 20, .42), inset 1px 1px 0 rgba(255,255,255,.035);
          backdrop-filter: blur(18px);
        }

        .sc-help-hero {
          position: relative;
          overflow: hidden;
          padding: 32px;
          border-radius: 28px;
        }

        .sc-help-hero::before,
        .sc-help-hero::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(1px);
        }

        .sc-help-hero::before {
          width: 240px;
          height: 240px;
          top: -150px;
          right: 20px;
          background: rgba(55, 150, 255, .11);
        }

        .sc-help-hero::after {
          width: 180px;
          height: 180px;
          right: 220px;
          bottom: -120px;
          background: rgba(145, 91, 255, .09);
        }

        .sc-help-eyebrow {
          position: relative;
          z-index: 1;
          display: inline-flex;
          margin-bottom: 10px;
          color: var(--sc-help-cyan);
          font-size: 15px;
          line-height: 1.2;
          font-weight: 850;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .sc-help-hero h1 {
          position: relative;
          z-index: 1;
          margin: 0;
          max-width: 900px;
          color: var(--sc-help-white);
          font-size: clamp(30px, 3.6vw, 44px);
          line-height: 1.06;
          letter-spacing: -.035em;
        }

        .sc-help-hero p {
          position: relative;
          z-index: 1;
          max-width: 790px;
          margin: 13px 0 0;
          color: var(--sc-help-copy);
          font-size: 15px;
          line-height: 1.7;
        }

        .sc-help-search-wrap {
          position: relative;
          z-index: 2;
          max-width: 820px;
          margin-top: 20px;
        }

        .sc-help-search {
          width: 100%;
          min-height: 52px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
          border: 1px solid rgba(112, 176, 255, .2);
          border-radius: 16px;
          background: rgba(5, 14, 33, .54);
          color: var(--sc-help-cyan);
          box-shadow: inset 1px 1px 0 rgba(255,255,255,.025), inset -1px -1px 0 rgba(0,0,0,.22);
          transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
        }

        .sc-help-search:focus-within {
          border-color: rgba(98, 232, 255, .48);
          box-shadow: 0 0 0 4px rgba(98, 232, 255, .07), inset 1px 1px 0 rgba(255,255,255,.025);
          transform: translateY(-1px);
        }

        .sc-help-search svg { flex: 0 0 auto; color: var(--sc-help-cyan); }

        .sc-help-search input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--sc-help-white);
          font-size: 15px;
          font-weight: 650;
        }

        .sc-help-search input::placeholder { color: #9fc1e5; }

        .sc-help-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(320px, .8fr);
          gap: 20px;
          margin-top: 20px;
          align-items: start;
        }

        .sc-help-panel {
          padding: 24px;
          border-radius: 24px;
        }

        .sc-help-panel + .sc-help-panel { margin-top: 18px; }

        .sc-help-heading {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-end;
          margin-bottom: 18px;
        }

        .sc-help-heading h2 {
          margin: 0;
          color: var(--sc-help-white);
          font-size: 24px;
          line-height: 1.15;
          letter-spacing: -.02em;
        }

        .sc-help-heading p {
          max-width: 620px;
          margin: 7px 0 0;
          color: var(--sc-help-copy);
          font-size: 15px;
          line-height: 1.6;
        }

        .sc-help-topic-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .sc-help-topic {
          padding: 17px;
          border: 1px solid rgba(112, 176, 255, .16);
          border-radius: 18px;
          background: var(--sc-help-card-soft);
          box-shadow: inset 1px 1px 0 rgba(255,255,255,.03), 0 10px 24px rgba(0,0,0,.14);
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .sc-help-topic:hover {
          transform: translateY(-2px);
          border-color: rgba(98, 232, 255, .28);
          box-shadow: 0 16px 30px rgba(0,0,0,.2), inset 1px 1px 0 rgba(255,255,255,.035);
        }

        .sc-help-topic-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          margin-bottom: 14px;
          border: 1px solid rgba(98,232,255,.16);
          border-radius: 14px;
          background: rgba(98,232,255,.08);
          color: var(--sc-help-cyan);
        }

        .sc-help-topic h3 {
          margin: 0;
          color: var(--sc-help-copy-strong);
          font-size: 16px;
          line-height: 1.25;
        }

        .sc-help-topic p {
          margin: 8px 0 0;
          color: var(--sc-help-copy);
          font-size: 15px;
          line-height: 1.65;
        }

        .sc-help-flow { display: grid; gap: 10px; }

        .sc-help-step {
          display: grid;
          grid-template-columns: 42px minmax(0,1fr);
          gap: 12px;
          align-items: center;
          padding: 13px;
          border: 1px solid rgba(112,176,255,.15);
          border-radius: 16px;
          background: rgba(10, 31, 64, .62);
        }

        .sc-help-step-number {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(98,232,255,.15);
          border-radius: 14px;
          background: rgba(62,139,230,.12);
          color: var(--sc-help-blue);
          font-size: 15px;
          font-weight: 900;
          letter-spacing: .05em;
        }

        .sc-help-step strong {
          display: block;
          color: var(--sc-help-copy-strong);
          font-size: 15px;
          line-height: 1.25;
        }

        .sc-help-step span {
          display: block;
          margin-top: 4px;
          color: var(--sc-help-copy);
          font-size: 15px;
          line-height: 1.5;
        }

        .sc-help-faq { border-bottom: 1px solid rgba(112,176,255,.14); }
        .sc-help-faq:last-child { border-bottom: 0; }

        .sc-help-faq-button {
          width: 100%;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          padding: 16px 0;
          border: 0;
          background: transparent;
          color: var(--sc-help-copy-strong);
          text-align: left;
          cursor: pointer;
        }

        .sc-help-faq-button strong { font-size: 15px; line-height: 1.45; }
        .sc-help-faq-button svg { flex: 0 0 auto; color: var(--sc-help-blue); transition: transform 160ms ease; }
        .sc-help-faq-button.open svg { transform: rotate(180deg); }

        .sc-help-faq-answer {
          padding: 0 34px 17px 0;
          color: var(--sc-help-copy);
          font-size: 15px;
          line-height: 1.7;
        }

        .sc-help-actions { display: grid; gap: 10px; }

        .sc-help-action {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          border: 1px solid rgba(112,176,255,.15);
          border-radius: 16px;
          background: rgba(10, 31, 64, .56);
          color: var(--sc-help-copy-strong);
          cursor: pointer;
          text-align: left;
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
        }

        .sc-help-action:hover {
          transform: translateY(-1px);
          border-color: rgba(98,232,255,.26);
          background: rgba(14, 40, 80, .72);
        }

        .sc-help-action-copy strong { display: block; color: var(--sc-help-copy-strong); font-size: 15px; }
        .sc-help-action-copy span { display: block; margin-top: 4px; color: var(--sc-help-copy); font-size: 15px; line-height: 1.45; }
        .sc-help-action-icon { color: var(--sc-help-blue); }

        .sc-help-empty {
          padding: 22px;
          border: 1px dashed rgba(112,176,255,.16);
          border-radius: 15px;
          color: var(--sc-help-copy);
          text-align: center;
          font-size: 15px;
        }

        .sc-help-note {
          margin-top: 18px;
          padding: 14px 15px;
          border: 1px solid rgba(98,232,255,.14);
          border-radius: 16px;
          background: rgba(98,232,255,.045);
          color: var(--sc-help-copy);
          font-size: 15px;
          line-height: 1.65;
        }

        @media (max-width: 980px) {
          .sc-help-layout { grid-template-columns: 1fr; }
        }

        @media (max-width: 720px) {
          .sc-help-page { padding: 24px 18px 42px; }
          .sc-help-hero { padding: 24px; }
          .sc-help-panel { padding: 20px; }
          .sc-help-topic-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 560px) {
          .sc-help-page { padding: 18px 14px 32px; }
          .sc-help-hero { padding: 20px; border-radius: 22px; }
          .sc-help-panel { padding: 18px; border-radius: 20px; }
          .sc-help-hero h1 { font-size: 30px; }
          .sc-help-heading h2 { font-size: 21px; }
          .sc-help-step { grid-template-columns: 38px minmax(0,1fr); }
          .sc-help-step-number { width: 38px; height: 38px; }
        }
      `}</style>

      <div className="sc-help-shell">
        <header className="sc-help-hero">
          <span className="sc-help-eyebrow">SKILLCOMPASS HELP CENTER</span>
          <h1>Understand how your career intelligence works.</h1>
          <p>
            Learn how GitHub, repository analysis, your current skill profile,
            Job Profiles, and actual job recommendations fit together.
          </p>

          <div className="sc-help-search-wrap">
            <label className="sc-help-search">
              <SvgIcon name="search" size={19} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search help topics or questions..."
                aria-label="Search help"
              />
            </label>
          </div>
        </header>

        <div className="sc-help-layout">
          <div>
            <section className="sc-help-panel">
              <div className="sc-help-heading">
                <div>
                  <h2>How SkillCompass works</h2>
                  <p>
                    The core flow from development evidence to career discovery
                    and actual opportunity matching.
                  </p>
                </div>
              </div>

              <div className="sc-help-topic-grid">
                {visibleTopics.length > 0 ? (
                  visibleTopics.map(topic => (
                    <article key={topic.id} className="sc-help-topic">
                      <div className="sc-help-topic-icon">
                        <SvgIcon name={topic.icon} size={20} />
                      </div>
                      <h3>{topic.title}</h3>
                      <p>{topic.description}</p>
                    </article>
                  ))
                ) : (
                  <div className="sc-help-empty">
                    No help topics match “{search}”.
                  </div>
                )}
              </div>

              <div className="sc-help-note">
                Analysis is the historical producer of intelligence. Job
                Profiles and Job Recommendations operate on your current
                cumulative skill and proficiency state.
              </div>
            </section>

            <section className="sc-help-panel">
              <div className="sc-help-heading">
                <div>
                  <h2>Frequently asked questions</h2>
                  <p>Common questions about the MVP workflow.</p>
                </div>
              </div>

              {visibleFaqs.length > 0 ? (
                visibleFaqs.map(item => {
                  const isOpen = openFaq === item.question;

                  return (
                    <div key={item.question} className="sc-help-faq">
                      <button
                        type="button"
                        className={`sc-help-faq-button ${isOpen ? 'open' : ''}`}
                        onClick={() =>
                          setOpenFaq(current =>
                            current === item.question ? null : item.question,
                          )
                        }
                        aria-expanded={isOpen}
                      >
                        <strong>{item.question}</strong>
                        <SvgIcon name="chevron" size={18} />
                      </button>

                      {isOpen ? (
                        <div className="sc-help-faq-answer">{item.answer}</div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="sc-help-empty">
                  No questions match “{search}”.
                </div>
              )}
            </section>
          </div>

          <aside>
            <section className="sc-help-panel">
              <div className="sc-help-heading">
                <div>
                  <h2>Your first journey</h2>
                  <p>Follow this order through the MVP.</p>
                </div>
              </div>

              <div className="sc-help-flow">
                <div className="sc-help-step">
                  <span className="sc-help-step-number">01</span>
                  <div>
                    <strong>Connect GitHub</strong>
                    <span>Bring your repositories into SkillCompass.</span>
                  </div>
                </div>

                <div className="sc-help-step">
                  <span className="sc-help-step-number">02</span>
                  <div>
                    <strong>Sync repositories</strong>
                    <span>Refresh the local repository catalog.</span>
                  </div>
                </div>

                <div className="sc-help-step">
                  <span className="sc-help-step-number">03</span>
                  <div>
                    <strong>Run analysis</strong>
                    <span>Generate evidence, skills and proficiency signals.</span>
                  </div>
                </div>

                <div className="sc-help-step">
                  <span className="sc-help-step-number">04</span>
                  <div>
                    <strong>Explore Job Profiles</strong>
                    <span>Discover career directions and role-level gaps.</span>
                  </div>
                </div>

                <div className="sc-help-step">
                  <span className="sc-help-step-number">05</span>
                  <div>
                    <strong>Open Recommendations</strong>
                    <span>Compare your current profile against actual openings.</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="sc-help-panel">
              <div className="sc-help-heading">
                <div>
                  <h2>Quick actions</h2>
                  <p>Jump directly to the workspace you need.</p>
                </div>
              </div>

              <div className="sc-help-actions">
                <button
                  type="button"
                  className="sc-help-action"
                  onClick={() => navigate('/github')}
                >
                  <span className="sc-help-action-copy">
                    <strong>GitHub Workspace</strong>
                    <span>Connect or sync repositories</span>
                  </span>
                  <span className="sc-help-action-icon">
                    <SvgIcon name="arrow" size={18} />
                  </span>
                </button>

                <button
                  type="button"
                  className="sc-help-action"
                  onClick={() => navigate('/analysis')}
                >
                  <span className="sc-help-action-copy">
                    <strong>Analysis History</strong>
                    <span>Review repository analysis runs</span>
                  </span>
                  <span className="sc-help-action-icon">
                    <SvgIcon name="arrow" size={18} />
                  </span>
                </button>

                <button
                  type="button"
                  className="sc-help-action"
                  onClick={() => navigate('/job-profiles')}
                >
                  <span className="sc-help-action-copy">
                    <strong>Job Profiles</strong>
                    <span>Explore career directions</span>
                  </span>
                  <span className="sc-help-action-icon">
                    <SvgIcon name="arrow" size={18} />
                  </span>
                </button>

                <button
                  type="button"
                  className="sc-help-action"
                  onClick={() => navigate('/job-recommendations')}
                >
                  <span className="sc-help-action-copy">
                    <strong>Recommendations</strong>
                    <span>Find actual job openings</span>
                  </span>
                  <span className="sc-help-action-icon">
                    <SvgIcon name="arrow" size={18} />
                  </span>
                </button>

                <button
                  type="button"
                  className="sc-help-action"
                  onClick={() => navigate('/settings')}
                >
                  <span className="sc-help-action-copy">
                    <strong>Settings</strong>
                    <span>Manage account and preferences</span>
                  </span>
                  <span className="sc-help-action-icon">
                    <SvgIcon name="arrow" size={18} />
                  </span>
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
