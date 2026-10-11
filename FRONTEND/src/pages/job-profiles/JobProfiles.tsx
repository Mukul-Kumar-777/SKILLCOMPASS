import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { navigate } from '../../router/appRouter';
import { SvgIcon } from '../../components/icons/SvgIcon';
import { getBackendJobProfiles, getCurrentUserSkills } from '../../api/jobProfiles';
import {
  CURATED_JOB_PROFILES,
  DOMAIN_OPTIONS,
  evaluateRole,
  mergeProfiles,
  normalizeSkillName,
  type CuratedJobProfile,
  type EvaluatedJobProfile,
  type RoleDomain,
  type UserSkillSignal,
} from '../../api/jobProfiles.catalog';
import './job-profiles.css';

type LoadState = 'loading' | 'ready';

function roleInitials(title: string): string {
  return title
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function alignmentLabel(score: number): EvaluatedJobProfile['alignmentLabel'] {
  if (score >= 70) return 'Strong direction';
  if (score >= 48) return 'Good direction';
  return 'Explore direction';
}

function roleAccent(domain: RoleDomain): string {
  if (domain === 'Software Development') return 'blue';
  if (domain === 'Data Science & Analytics') return 'mint';
  if (domain === 'AI & Machine Learning') return 'purple';
  return 'cyan';
}

function makeFallbackEvaluation(profile: CuratedJobProfile): EvaluatedJobProfile {
  const skills = profile.skills.map(skill => ({
    ...skill,
    userScore: null,
    state: 'gap' as const,
  }));
  const gaps = skills.filter(skill => skill.type !== 'preferred');
  return {
    ...profile,
    skills,
    alignment: 0,
    alignmentLabel: alignmentLabel(0),
    matchedSkills: [],
    developingSkills: [],
    gapSkills: gaps,
  };
}

function RoleMark({ title, domain }: { title: string; domain: RoleDomain }) {
  return (
    <span className={`jp-role-mark jp-role-mark-${roleAccent(domain)}`} aria-hidden="true">
      {roleInitials(title)}
    </span>
  );
}

function AlignmentRing({ score }: { score: number }) {
  const degrees = Math.max(0, Math.min(100, score)) * 3.6;
  return (
    <div
      className="jp-alignment-ring"
      style={{ '--ring-degrees': `${degrees}deg` } as CSSProperties}
      aria-label={`${score}% profile alignment`}
    >
      <div className="jp-alignment-ring-inner">
        <strong>{score}%</strong>
        <span>alignment</span>
      </div>
    </div>
  );
}

function buildUserSkillMap(skills: UserSkillSignal[]) {
  return new Map(skills.map(skill => [normalizeSkillName(skill.name), skill]));
}

export default function JobProfiles({ profileSlug }: { profileSlug?: string }) {
  const [catalog, setCatalog] = useState<CuratedJobProfile[]>(CURATED_JOB_PROFILES);
  const [userSkills, setUserSkills] = useState<UserSkillSignal[]>([]);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<RoleDomain | 'All domains'>('All domains');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [backendNotice, setBackendNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      setLoadState('loading');

      const [backendResult, currentSkillsResult] = await Promise.allSettled([
        getBackendJobProfiles({ limit: 200 }),
        getCurrentUserSkills(),
      ]);

      if (cancelled) return;

      let nextCatalog = CURATED_JOB_PROFILES;
      if (backendResult.status === 'fulfilled') {
        nextCatalog = mergeProfiles(CURATED_JOB_PROFILES, backendResult.value);
      } else {
        setBackendNotice('Showing the built-in role catalog while the expanded catalog is unavailable.');
      }

      setCatalog(nextCatalog);

      if (currentSkillsResult.status === 'fulfilled') {
        setUserSkills(currentSkillsResult.value);
      } else {
        setUserSkills([]);
        setBackendNotice(previous =>
          previous ||
          'Your current skill profile is unavailable right now, so role directions are shown without personalization.',
        );
      }

      setLoadState('ready');
    }

    void loadPageData();
    return () => {
      cancelled = true;
    };
  }, []);

  const evaluatedProfiles = useMemo(() => {
    return catalog.map(profile =>
      userSkills.length ? evaluateRole(profile, userSkills) : makeFallbackEvaluation(profile),
    );
  }, [catalog, userSkills]);

  const selectedProfile = profileSlug
    ? evaluatedProfiles.find(profile => profile.slug === profileSlug)
    : undefined;

  const filteredProfiles = useMemo(() => {
    const term = query.trim().toLowerCase();
    return evaluatedProfiles.filter(profile => {
      const domainMatch = domain === 'All domains' || profile.domain === domain;
      const textMatch = !term || [profile.title, profile.domain, ...profile.aliases]
        .some(value => value.toLowerCase().includes(term));
      return domainMatch && textMatch;
    });
  }, [domain, evaluatedProfiles, query]);

  const isExploring = Boolean(query.trim()) || domain !== 'All domains';
  const rankedRecommended = useMemo(() => {
    const deduped = [...evaluatedProfiles].sort((a, b) => {
      if (b.alignment !== a.alignment) return b.alignment - a.alignment;
      const aCore = a.skills.filter(skill => skill.type === 'core').length;
      const bCore = b.skills.filter(skill => skill.type === 'core').length;
      return bCore - aCore;
    });

    /*
     * When the current skill profile has no stored signals, keep the catalog
     * discoverable so the page remains useful as a general role-exploration
     * screen.
     *
     * When current skill signals exist, only profiles with actual evidence
     * from the user's persisted skill profile are presented as recommended
     * directions. This avoids showing zero-evidence roles as personalized
     * recommendations.
     */
    if (!userSkills.length) {
      return deduped.slice(0, 12);
    }

    return deduped
      .filter(
        profile =>
          profile.alignment > 0 ||
          profile.matchedSkills.length > 0 ||
          profile.developingSkills.length > 0,
      )
      .slice(0, 12);
  }, [evaluatedProfiles, userSkills]);

  const displayProfiles = isExploring ? filteredProfiles : rankedRecommended;

  if (profileSlug && loadState !== 'loading' && selectedProfile) {
    return (
      <RoleDetail
        profile={selectedProfile}
        userSkills={userSkills}
      />
    );
  }

  if (profileSlug && loadState !== 'loading' && !selectedProfile) {
    return (
      <main className="main-area job-profiles-page">
        <section className="jp-empty clay-card">
          <span className="jp-empty-icon"><SvgIcon name="search" size={28} /></span>
          <h1>Role profile not found</h1>
          <p>The role you opened is not currently available in the SkillCompass catalog.</p>
          <button type="button" className="jp-primary-btn" onClick={() => navigate('/job-profiles')}>Back to Job Profiles</button>
        </section>
      </main>
    );
  }

  return (
    <main className="main-area job-profiles-page">
      <header className="jp-hero">
        <div className="jp-hero-copy">
          <div className="jp-hero-labels">
            <span className="jp-eyebrow"><SvgIcon name="briefcase" size={18} /> CAREER DIRECTION</span>
            <span className="jp-scope-pill">ROLE PROFILES · NOT OPENINGS</span>
          </div>
          <h1>Find the career directions that fit your skills.</h1>
          <p>
            SkillCompass looks at your detected skills and proficiency to surface roles worth exploring.
            You do not need to know the job title first. Choose a role to understand the path, then move to Job Recommendations for actual openings.
          </p>
        </div>
        <div className="jp-hero-visual" aria-hidden="true">
          <div className="jp-hero-glow glow-one" />
          <div className="jp-hero-glow glow-two" />
          <div className="jp-compass">
            <div className="jp-compass-core"><SvgIcon name="target" size={34} /></div>
            <span className="jp-compass-label label-one">SKILLS</span>
            <span className="jp-compass-label label-two">PROFICIENCY</span>
            <span className="jp-compass-label label-three">ROLE</span>
            <span className="jp-compass-label label-four">PATH</span>
          </div>
        </div>
      </header>

      <section className="jp-search-panel clay-card">
        <div className="jp-search-field">
          <SvgIcon name="search" size={22} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search any career role, e.g. DevOps Engineer"
            aria-label="Search job profiles"
          />
          {query && (
            <button type="button" className="jp-clear" onClick={() => setQuery('')}>Clear</button>
          )}
        </div>
        <div className="jp-domain-row" aria-label="Role domains">
          {DOMAIN_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              className={`jp-domain-filter ${domain === option ? 'active' : ''}`}
              onClick={() => setDomain(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="jp-section">
        <div className="jp-section-head">
          <div>
            <span className="jp-section-kicker">{isExploring ? 'ROLE EXPLORATION' : 'DISCOVERED FROM YOUR PROFILE'}</span>
            <h2>{isExploring ? 'Explore career roles' : 'Recommended career directions'}</h2>
            <p>
              {userSkills.length
                ? 'These directions are derived from your current persisted skills and proficiency signals.'
                : 'Your current skill profile has no stored signals yet, so you can still explore the role catalog.'}
            </p>
          </div>
          <div className="jp-count-pill"><strong>{displayProfiles.length}</strong><span>{isExploring ? 'results' : 'directions'}</span></div>
        </div>

        {backendNotice && <div className="jp-data-notice" role="status">{backendNotice}</div>}

        {loadState === 'loading' ? (
          <div className="jp-loading-grid" aria-label="Loading career directions">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="jp-skeleton clay-card" />)}
          </div>
        ) : displayProfiles.length > 0 ? (
          <div className="jp-role-grid">
            {displayProfiles.map((profile, index) => (
              <button
                key={profile.slug}
                type="button"
                className={`jp-role-card clay-card ${index === 0 && !isExploring ? 'featured' : ''}`}
                onClick={() => navigate(`/job-profiles/${profile.slug}`)}
              >
                <div className="jp-role-top">
                  <RoleMark title={profile.title} domain={profile.domain} />
                  <span className={`jp-domain-badge jp-domain-${roleAccent(profile.domain)}`}>{profile.domain}</span>
                </div>

                <div className="jp-role-title-block">
                  <h3>{profile.title}</h3>
                  <span>{profile.source === 'curated' ? 'Curated SkillCompass role' : 'Expanded role catalog'}</span>
                </div>

                <p className="jp-role-description">{profile.description}</p>

                <div className="jp-role-alignment">
                  <AlignmentRing score={profile.alignment} />
                  <div className="jp-direction-copy">
                    <strong>{profile.alignmentLabel}</strong>
                    <span>Based on your current skills and proficiency.</span>
                  </div>
                </div>

                <div className="jp-role-skill-block">
                  <div className="jp-role-skill-head"><span>Skills you already show</span><strong>{profile.matchedSkills.length}</strong></div>
                  <div className="jp-chip-row">
                    {profile.matchedSkills.slice(0, 4).map(skill => <span key={skill.name} className="jp-chip matched">{skill.name}</span>)}
                    {!profile.matchedSkills.length && <span className="jp-chip neutral">Build from the role basics</span>}
                  </div>
                </div>

                <div className="jp-role-skill-block gap-block">
                  <div className="jp-role-skill-head"><span>Role-level gaps to explore</span><strong>{profile.gapSkills.length}</strong></div>
                  <div className="jp-chip-row">
                    {profile.gapSkills.slice(0, 3).map(skill => <span key={skill.name} className="jp-chip gap">{skill.name}</span>)}
                    {profile.developingSkills.slice(0, Math.max(0, 3 - profile.gapSkills.length)).map(skill => <span key={skill.name} className="jp-chip developing">{skill.name}</span>)}
                    {!profile.gapSkills.length && !profile.developingSkills.length && <span className="jp-chip neutral">No major gaps detected</span>}
                  </div>
                </div>

                <span className="jp-card-action">Explore role profile <SvgIcon name="arrow" size={18} /></span>
              </button>
            ))}
          </div>
        ) : (
          <div className="jp-empty clay-card">
            <span className="jp-empty-icon"><SvgIcon name="search" size={28} /></span>
            <h3>No role profile found</h3>
            <p>Try another role title or select a broader domain.</p>
            <button type="button" className="jp-primary-btn" onClick={() => { setQuery(''); setDomain('All domains'); }}>Reset search</button>
          </div>
        )}
      </section>

      <section className="jp-explanation-strip clay-card">
        <div className="jp-explanation-icon"><SvgIcon name="sparkle" size={23} /></div>
        <div className="jp-explanation-copy">
          <span className="jp-section-kicker">WHAT THIS PAGE DOES</span>
          <h3>It gives you a career direction before you start searching openings.</h3>
          <p>
            Role-level gaps help you understand what to develop for the direction. Job Recommendations will handle the deeper comparison against each real opening.
          </p>
        </div>
        <div className="jp-flow">
          <span>Skills</span><i>→</i><span>Career role</span><i>→</i><span>Actual jobs</span>
        </div>
      </section>
    </main>
  );
}

function RoleDetail({
  profile,
  userSkills,
}: {
  profile: EvaluatedJobProfile;
  userSkills: UserSkillSignal[];
}) {
  const skillMap = buildUserSkillMap(userSkills);

  return (
    <main className="main-area job-profiles-page job-profile-detail-page">
      <button type="button" className="jp-back" onClick={() => navigate('/job-profiles')}>
        <span>←</span> Back to Job Profiles
      </button>

      <section className="jp-detail-hero clay-card">
        <div className="jp-detail-left">
          <RoleMark title={profile.title} domain={profile.domain} />
          <div>
            <div className="jp-detail-meta">
              <span className="jp-eyebrow">ROLE PROFILE</span>
              <span className="jp-detail-domain">{profile.domain}</span>
            </div>
            <h1>{profile.title}</h1>
            <p>{profile.description}</p>
          </div>
        </div>
        <div className="jp-detail-fit">
          <AlignmentRing score={profile.alignment} />
          <div>
            <span>Profile alignment</span>
            <strong>{profile.alignmentLabel}</strong>
            <small>Directional guidance, not a hiring prediction.</small>
          </div>
        </div>
      </section>

      <section className="jp-stat-grid">
        <article className="jp-stat clay-card">
          <span>Skills already demonstrated</span>
          <strong>{profile.matchedSkills.length}</strong>
          <small>Relevant signals found in your profile</small>
        </article>
        <article className="jp-stat clay-card">
          <span>Skills still developing</span>
          <strong>{profile.developingSkills.length}</strong>
          <small>Present, but below the role target</small>
        </article>
        <article className="jp-stat clay-card">
          <span>Role-level gaps</span>
          <strong>{profile.gapSkills.length}</strong>
          <small>Capabilities to explore for this direction</small>
        </article>
        <article className="jp-stat clay-card">
          <span>Profile source</span>
          <strong>Catalog</strong>
          <small>Role definition used by SkillCompass</small>
        </article>
      </section>

      <section className="jp-detail-grid">
        <article className="jp-detail-card clay-card">
          <div className="jp-card-head">
            <div>
              <span className="jp-section-kicker">ROLE REQUIREMENTS</span>
              <h2>Skill landscape</h2>
            </div>
            <span className="jp-mini-pill">{profile.skills.length} role skills</span>
          </div>

          <div className="jp-skill-table">
            {profile.skills.map(skill => {
              const matched = skill.userScore !== null;
              return (
                <div key={skill.name} className="jp-skill-row">
                  <div className="jp-skill-name">
                    <strong>{skill.name}</strong>
                    <span>{skill.type === 'core' ? 'Core role skill' : skill.type === 'important' ? 'Important skill' : 'Helpful skill'}</span>
                  </div>
                  <div className="jp-skill-meter-wrap">
                    <div className="jp-skill-meter-labels">
                      <span>Your signal</span><strong>{matched ? `${Math.round(skill.userScore ?? 0)}%` : 'Not detected'}</strong>
                    </div>
                    <div className="jp-bar-track">
                      <i className="jp-bar-user" style={{ width: `${skill.userScore ?? 0}%` }} />
                    </div>
                    <div className="jp-skill-meter-labels target-labels">
                      <span>Role reference</span><strong>{skill.requiredLevel}%</strong>
                    </div>
                    <div className="jp-bar-track role-track">
                      <i className="jp-bar-role" style={{ width: `${skill.requiredLevel}%` }} />
                    </div>
                  </div>
                  <span className={`jp-state-pill ${skill.state}`}>
                    {skill.state === 'matched' ? 'Demonstrated' : skill.state === 'developing' ? 'Developing' : 'Gap'}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="jp-detail-card jp-responsibility-card clay-card">
          <div className="jp-card-head">
            <div>
              <span className="jp-section-kicker">ROLE CONTEXT</span>
              <h2>What this role involves</h2>
            </div>
            <SvgIcon name="briefcase" size={22} />
          </div>
          <div className="jp-responsibilities">
            {profile.responsibilities.map((item, index) => (
              <div key={item} className="jp-responsibility-item">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <div className="jp-role-note">
            <span className="jp-note-icon"><SvgIcon name="target" size={18} /></span>
            <div>
              <strong>Use the gaps as direction.</strong>
              <p>They describe the role path. The next page will compare you against real openings.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="jp-gap-highlight clay-card">
        <div>
          <span className="jp-section-kicker">YOUR NEXT DEVELOPMENT AREAS</span>
          <h2>Skills worth exploring for this career direction</h2>
          <p>These are role-level gaps and developing areas based on the current role profile.</p>
        </div>
        <div className="jp-gap-highlight-list">
          {[...profile.gapSkills, ...profile.developingSkills].slice(0, 6).map(skill => {
            const current = skillMap.get(normalizeSkillName(skill.name));
            return (
              <div key={skill.name} className="jp-highlight-chip">
                <span>{skill.name}</span>
                <strong>{current ? `${Math.round(current.score)}% current signal` : 'Not detected'}</strong>
              </div>
            );
          })}
          {!profile.gapSkills.length && !profile.developingSkills.length && (
            <div className="jp-highlight-chip success-chip"><span>Your role profile has no obvious development gaps.</span></div>
          )}
        </div>
      </section>

      <section className="jp-next-step clay-card">
        <div>
          <span className="jp-section-kicker">NEXT STEP</span>
          <h2>Use this role as your search direction</h2>
          <p>When Job Recommendations is opened for this role, it will handle actual openings and compare your profile against each specific opportunity.</p>
        </div>
        <div className="jp-next-step-actions">
          <span className="jp-next-step-badge">ROLE → ACTUAL OPENINGS</span>
          <button
            type="button"
            className="jp-primary-btn"
            onClick={() => {
              navigate(
                `/job-recommendations/${encodeURIComponent(profile.slug)}`,
              );
            }}
          >
            See Actual Job Openings
          </button>
        </div>
      </section>
    </main>
  );
}
