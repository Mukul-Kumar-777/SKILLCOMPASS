import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import avatarReference from '../../assets/avatar-reference.png';
import { navigate } from '../../router/appRouter';
import { SvgIcon } from '../../components/icons/SvgIcon';
import { getCurrentUserSkills, getBackendJobProfiles } from '../../api/jobProfiles';
import {
  CURATED_JOB_PROFILES,
  evaluateRole,
  mergeProfiles,
  type CuratedJobProfile,
  type EvaluatedJobProfile,
  type UserSkillSignal,
} from '../../api/jobProfiles.catalog';
import { getJobRecommendations, type RecommendedJob } from '../../api/jobRecommendations';
import { getAnalysisLatestRun, type AnalysisRun } from '../../api/analysis';
import {
  formatCachedSyncTime,
  getCachedGithubRepositories,
  isGithubConnected,
} from '../../api/github';

type LoadState = 'loading' | 'ready' | 'error';

interface DashboardData {
  skills: UserSkillSignal[];
  profiles: EvaluatedJobProfile[];
  analysis: AnalysisRun | null;
  recommendations: RecommendedJob[];
}

const formatScore = (value: number): string => {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatRelative = (value?: string | null): string => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return formatDateTime(value);
};

const initials = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

function ClayButton({
  children,
  onClick,
  className = '',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`scd-button ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function StatCard({
  icon,
  value,
  label,
  detail,
  tone,
}: {
  icon: string;
  value: string;
  label: string;
  detail: string;
  tone: 'blue' | 'mint' | 'purple' | 'coral';
}) {
  return (
    <article className={`scd-stat-card scd-tone-${tone}`}>
      <div className="scd-stat-icon">
        <SvgIcon name={icon} size={24} />
      </div>
      <div className="scd-stat-copy">
        <strong>{value}</strong>
        <span>{label}</span>
        <small>{detail}</small>
      </div>
      <div className="scd-stat-orb" aria-hidden="true" />
    </article>
  );
}

function AlignmentRing({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score));
  return (
    <div
      className="scd-alignment-ring"
      style={{ '--scd-ring': `${safeScore * 3.6}deg` } as CSSProperties}
      aria-label={`${Math.round(safeScore)} percent alignment`}
    >
      <div className="scd-alignment-ring-inner">
        <strong>{Math.round(safeScore)}%</strong>
        <span>fit</span>
      </div>
    </div>
  );
}

function SkillBar({ skill }: { skill: UserSkillSignal }) {
  const score = Math.max(0, Math.min(100, skill.score));
  const level = skill.level ?? (
    score >= 80 ? 'Expert' :
    score >= 65 ? 'Advanced' :
    score >= 40 ? 'Intermediate' :
    'Beginner'
  );

  return (
    <div className="scd-skill-row">
      <div className="scd-skill-avatar">
        {initials(skill.name)}
      </div>
      <div className="scd-skill-main">
        <div className="scd-skill-label">
          <strong>{skill.name}</strong>
          <span>{level}</span>
        </div>
        <div className="scd-meter">
          <i style={{ width: `${score}%` }} />
        </div>
      </div>
      <strong className="scd-skill-score">{formatScore(score)}</strong>
    </div>
  );
}

function RoleCard({
  profile,
  index,
  onOpen,
}: {
  profile: EvaluatedJobProfile;
  index: number;
  onOpen: () => void;
}) {
  return (
    <article className={`scd-role-card ${index === 0 ? 'featured' : ''}`}>
      <div className="scd-role-top">
        <span className="scd-role-rank">0{index + 1}</span>
        <span className="scd-domain-pill">{profile.domain}</span>
      </div>

      <div className="scd-role-title">
        <div className="scd-role-mark">{initials(profile.title)}</div>
        <div>
          <h3>{profile.title}</h3>
          <span>{profile.description}</span>
        </div>
      </div>

      <div className="scd-role-fit">
        <AlignmentRing score={profile.alignment} />
        <div>
          <small>Profile alignment</small>
          <strong>{profile.alignmentLabel}</strong>
        </div>
      </div>

      <div className="scd-role-meta">
        <span><b>{profile.matchedSkills.length}</b> demonstrated</span>
        <span><b>{profile.developingSkills.length}</b> developing</span>
        <span><b>{profile.gapSkills.length}</b> role gaps</span>
      </div>

      <button type="button" className="scd-link-button" onClick={onOpen}>
        Explore role <SvgIcon name="arrow" size={16} />
      </button>
    </article>
  );
}

function JobRow({ recommendation }: { recommendation: RecommendedJob }) {
  const job = recommendation.job;
  if (!job) return null;

  return (
    <article className="scd-job-row">
      <div className="scd-company-mark">{initials(job.companyName)}</div>

      <div className="scd-job-main">
        <div className="scd-job-title-line">
          <h3>{job.title}</h3>
          <span className={`scd-score-badge scd-score-${recommendation.matchScore >= 75 ? 'high' : recommendation.matchScore >= 50 ? 'mid' : 'low'}`}>
            {recommendation.matchScore.toFixed(1)}%
          </span>
        </div>
        <p>{job.companyName}</p>
        <div className="scd-job-tags">
          <span>{job.location || 'Location unavailable'}</span>
          {job.remote && <span>Remote</span>}
          <span>{job.source}</span>
        </div>
      </div>

      <div className="scd-job-gap">
        <strong>{recommendation.skillGapCount}</strong>
        <span>opening gaps</span>
      </div>

      <button
        type="button"
        className="scd-icon-action"
        aria-label={`Open ${job.title}`}
        onClick={() => window.open(job.url, '_blank', 'noopener,noreferrer')}
      >
        <SvgIcon name="arrow" size={17} />
      </button>
    </article>
  );
}

export default function Dashboard() {
  const cachedGithub = getCachedGithubRepositories();
  const githubConnected = isGithubConnected();

  const [data, setData] = useState<DashboardData>({
    skills: [],
    profiles: [],
    analysis: null,
    recommendations: [],
  });
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoadState('loading');

      const [skillsResult, profilesResult, analysisResult] = await Promise.allSettled([
        getCurrentUserSkills(),
        getBackendJobProfiles({ limit: 200 }),
        getAnalysisLatestRun(),
      ]);

      if (cancelled) return;

      const skills =
        skillsResult.status === 'fulfilled' ? skillsResult.value : [];

      const profiles =
        profilesResult.status === 'fulfilled'
          ? mergeProfiles(CURATED_JOB_PROFILES, profilesResult.value)
          : CURATED_JOB_PROFILES;

      const analysis =
        analysisResult.status === 'fulfilled' ? analysisResult.value : null;

      const evaluatedProfiles = profiles
        .map(profile =>
          skills.length
            ? evaluateRole(profile, skills)
            : {
                ...profile,
                skills: profile.skills.map(skill => ({
                  ...skill,
                  userScore: null,
                  state: 'gap' as const,
                })),
                alignment: 0,
                alignmentLabel: 'Explore direction' as const,
                matchedSkills: [],
                developingSkills: [],
                gapSkills: profile.skills.filter(skill => skill.type !== 'preferred').map(skill => ({
                  ...skill,
                  userScore: null,
                  state: 'gap' as const,
                })),
              },
        )
        .sort((a, b) => {
          if (b.alignment !== a.alignment) return b.alignment - a.alignment;
          return b.matchedSkills.length - a.matchedSkills.length;
        });

      const topRole = evaluatedProfiles[0];
      let recommendations: RecommendedJob[] = [];

      if (topRole && skills.length) {
        try {
          const recommendationResult = await getJobRecommendations({
            jobProfileSlug: topRole.slug,
          });
          recommendations = recommendationResult.recommendations;
        } catch {
          recommendations = [];
        }
      }

      if (cancelled) return;

      setData({
        skills,
        profiles: evaluatedProfiles,
        analysis,
        recommendations,
      });
      setLoadState('ready');
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string) => setToast(message);

  const visibleSkills = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const sorted = [...data.skills].sort((a, b) => b.score - a.score);
    if (!normalized) return sorted.slice(0, 6);

    return sorted
      .filter(skill => skill.name.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [data.skills, query]);

  const visibleRoles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.profiles.slice(0, 3);

    return data.profiles
      .filter(profile =>
        [profile.title, profile.domain, ...profile.aliases]
          .some(value => value.toLowerCase().includes(normalized)),
      )
      .slice(0, 3);
  }, [data.profiles, query]);

  const visibleJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const recommendations = data.recommendations.filter(item => item.job);

    if (!normalized) return recommendations.slice(0, 3);

    return recommendations
      .filter(item => {
        const job = item.job;
        if (!job) return false;
        return `${job.title} ${job.companyName} ${job.location ?? ''}`
          .toLowerCase()
          .includes(normalized);
      })
      .slice(0, 3);
  }, [data.recommendations, query]);

  const averageProficiency = useMemo(() => {
    if (!data.skills.length) return 0;
    return data.skills.reduce((sum, skill) => sum + skill.score, 0) / data.skills.length;
  }, [data.skills]);

  const topRole = data.profiles[0] ?? null;

  const skillGapCount = topRole?.gapSkills.length ?? 0;

  const firstName = cachedGithub.username || 'Developer';

  return (
    <>
      <style>{`
        .scd-dashboard {
          --scd-bg: var(--sc-bg);
          --scd-panel: var(--sc-card);
          --scd-panel-soft: var(--sc-card-soft);
          --scd-border: var(--sc-line);
          --scd-text: var(--sc-text);
          --scd-muted: var(--sc-copy);
          --scd-soft: var(--sc-dim);
          --scd-blue: var(--sc-blue);
          --scd-mint: var(--sc-mint);
          --scd-purple: var(--sc-purple);
          --scd-coral: #ff8f8f;
          min-height: 100%;
          padding: 8px 0 34px;
          color: var(--scd-text);
        }

        .scd-dashboard * { box-sizing: border-box; }

        .scd-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          gap: 18px;
          margin-bottom: 18px;
        }

        .scd-hero-main,
        .scd-hero-side,
        .scd-section,
        .scd-role-card,
        .scd-job-row {
          border: 1px solid var(--scd-border);
          box-shadow:
            0 18px 38px rgba(0,0,0,.22),
            inset 1px 1px 0 rgba(255,255,255,.055),
            inset -2px -2px 5px rgba(0,0,0,.12);
        }

        .scd-hero-main {
          position: relative;
          min-height: 244px;
          overflow: hidden;
          border-radius: 30px;
          padding: 30px 34px;
          background:
            radial-gradient(circle at 83% 20%, rgba(101,169,255,.16), transparent 25%),
            radial-gradient(circle at 90% 80%, rgba(157,140,255,.13), transparent 28%),
            var(--scd-panel);
        }

        .scd-hero-main::before {
          content: '';
          position: absolute;
          width: 190px;
          height: 190px;
          right: -55px;
          top: -60px;
          border-radius: 50%;
          border: 1px solid rgba(130,183,255,.14);
          box-shadow:
            0 0 0 28px rgba(100,160,255,.025),
            0 0 0 56px rgba(100,160,255,.015);
          animation: scd-orbit 10s linear infinite;
        }

        .scd-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #88bbff;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: .17em;
          text-transform: uppercase;
        }

        .scd-hero-main h1 {
          max-width: 760px;
          margin: 12px 0 10px;
          font-size: clamp(30px, 3vw, 46px);
          line-height: 1.04;
          letter-spacing: -.035em;
        }

        .scd-hero-main p {
          max-width: 730px;
          margin: 0;
          color: var(--scd-muted);
          font-size: 15px;
          line-height: 1.7;
        }

        .scd-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
        }

        .scd-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 16px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
          color: #f5f8ff;
          background: linear-gradient(145deg, #354969, #26344c);
          box-shadow:
            0 9px 18px rgba(0,0,0,.22),
            inset 1px 1px 0 rgba(255,255,255,.06),
            inset -2px -2px 5px rgba(0,0,0,.17);
          cursor: pointer;
          font-weight: 750;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .scd-button:hover { transform: translateY(-2px); box-shadow: 0 14px 24px rgba(0,0,0,.27), inset 1px 1px 0 rgba(255,255,255,.07); }
        .scd-button:disabled { opacity: .55; cursor: default; transform: none; }

        .scd-button.primary {
          background: linear-gradient(135deg, #4a84e8, #645ce8 75%);
          box-shadow: 0 10px 24px rgba(71,101,220,.27), inset 1px 1px 0 rgba(255,255,255,.13);
        }

        .scd-button.ghost { background: rgba(255,255,255,.025); }

        .scd-hero-side {
          border-radius: 30px;
          padding: 22px;
          background:
            radial-gradient(circle at 85% 15%, rgba(110,232,207,.12), transparent 24%),
            var(--scd-panel-soft);
        }

        .scd-identity {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .scd-avatar {
          width: 54px;
          height: 54px;
          overflow: hidden;
          border-radius: 17px;
          border: 1px solid rgba(255,255,255,.09);
          box-shadow: 0 9px 16px rgba(0,0,0,.25);
          background: #26344e;
          flex: 0 0 auto;
        }

        .scd-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .scd-identity strong { display: block; font-size: 16px; }
        .scd-identity span { display: block; margin-top: 3px; color: var(--scd-muted); font-size: 15px; }

        .scd-source-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }

        .scd-source-tile {
          min-height: 92px;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255,255,255,.028);
          border: 1px solid rgba(255,255,255,.055);
        }

        .scd-source-tile .label {
          display: block;
          color: var(--scd-soft);
          font-size: 15px;
          font-weight: 750;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .scd-source-tile strong { display: block; margin-top: 10px; font-size: 21px; }
        .scd-source-tile small { display: block; margin-top: 3px; color: var(--scd-muted); font-size: 15px; }

        .scd-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 14px;
          color: #9deedb;
          font-size: 15px;
          font-weight: 700;
        }

        .scd-status i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--scd-mint);
          box-shadow: 0 0 10px rgba(110,232,207,.55);
        }

        .scd-status.offline { color: #ffb3b3; }
        .scd-status.offline i { background: var(--scd-coral); box-shadow: 0 0 10px rgba(255,143,143,.45); }

        .scd-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .scd-stat-card {
          position: relative;
          min-height: 132px;
          overflow: hidden;
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding: 18px;
          border-radius: 24px;
          background: var(--scd-panel);
        }

        .scd-stat-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.07);
          flex: 0 0 auto;
        }

        .scd-tone-blue .scd-stat-icon { color: var(--scd-blue); }
        .scd-tone-mint .scd-stat-icon { color: var(--scd-mint); }
        .scd-tone-purple .scd-stat-icon { color: var(--scd-purple); }
        .scd-tone-coral .scd-stat-icon { color: var(--scd-coral); }

        .scd-stat-copy strong { display: block; font-size: 28px; line-height: 1; letter-spacing: -.04em; }
        .scd-stat-copy span { display: block; margin-top: 6px; font-size: 15px; font-weight: 750; }
        .scd-stat-copy small { display: block; max-width: 150px; margin-top: 7px; color: var(--scd-muted); font-size: 15px; line-height: 1.4; }

        .scd-stat-orb {
          position: absolute;
          right: -18px;
          bottom: -26px;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          opacity: .55;
        }

        .scd-tone-blue .scd-stat-orb { background: radial-gradient(circle, rgba(101,169,255,.17), transparent 68%); }
        .scd-tone-mint .scd-stat-orb { background: radial-gradient(circle, rgba(110,232,207,.16), transparent 68%); }
        .scd-tone-purple .scd-stat-orb { background: radial-gradient(circle, rgba(157,140,255,.17), transparent 68%); }
        .scd-tone-coral .scd-stat-orb { background: radial-gradient(circle, rgba(255,143,143,.15), transparent 68%); }

        .scd-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
          gap: 18px;
        }

        .scd-section {
          border-radius: 28px;
          padding: 22px;
          background: var(--scd-panel);
          min-width: 0;
        }

        .scd-section.wide { grid-column: 1 / -1; }

        .scd-section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .scd-section-head h2 {
          margin: 0;
          font-size: 19px;
          letter-spacing: -.018em;
        }

        .scd-section-head p {
          margin: 5px 0 0;
          color: var(--scd-muted);
          font-size: 15px;
          line-height: 1.45;
        }

        .scd-section-kicker {
          display: block;
          margin-bottom: 5px;
          color: #7eaef0;
          font-size: 15px;
          font-weight: 850;
          letter-spacing: .15em;
          text-transform: uppercase;
        }

        .scd-mini-action {
          border: 0;
          color: #b2d3ff;
          background: transparent;
          font-weight: 750;
          font-size: 15px;
          cursor: pointer;
        }

        .scd-skill-list { display: grid; gap: 13px; }

        .scd-skill-row {
          display: grid;
          grid-template-columns: 40px minmax(0,1fr) 44px;
          gap: 12px;
          align-items: center;
          padding: 11px 12px;
          border-radius: 18px;
          background: rgba(255,255,255,.024);
          border: 1px solid rgba(255,255,255,.045);
        }

        .scd-skill-avatar {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          color: #dcecff;
          background: linear-gradient(145deg, rgba(82,137,218,.32), rgba(63,79,128,.2));
          border: 1px solid rgba(144,191,255,.11);
          font-size: 15px;
          font-weight: 850;
          letter-spacing: .05em;
        }

        .scd-skill-label { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 7px; }
        .scd-skill-label strong { font-size: 15px; }
        .scd-skill-label span { color: #97adca; font-size: 15px; }

        .scd-meter {
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(7,14,27,.68);
          box-shadow: inset 0 1px 3px rgba(0,0,0,.45);
        }

        .scd-meter i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #4b92ed, #74c8ff 55%, #78ead6);
          box-shadow: 0 0 13px rgba(100,177,255,.24);
        }

        .scd-skill-score { color: #deebff; font-size: 15px; text-align: right; }

        .scd-role-list { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }

        .scd-role-card {
          min-width: 0;
          border-radius: 22px;
          padding: 17px;
          background: linear-gradient(145deg, rgba(35,50,77,.8), rgba(17,27,44,.96));
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .scd-role-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 22px 38px rgba(0,0,0,.27), inset 1px 1px 0 rgba(255,255,255,.06);
        }

        .scd-role-card.featured {
          background:
            radial-gradient(circle at 92% 8%, rgba(110,232,207,.11), transparent 26%),
            linear-gradient(145deg, rgba(39,59,88,.94), rgba(18,29,47,.98));
        }

        .scd-role-top { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
        .scd-role-rank { color: #78dfff; font-size: 15px; font-weight: 850; letter-spacing: .1em; }
        .scd-domain-pill { max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #9be8ff; font-size: 15px; }

        .scd-role-title { display: flex; gap: 11px; margin-top: 16px; min-height: 60px; }
        .scd-role-mark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: linear-gradient(145deg, rgba(97,149,236,.36), rgba(96,88,192,.24));
          border: 1px solid rgba(157,199,255,.11);
          font-size: 15px;
          font-weight: 900;
          flex: 0 0 auto;
        }

        .scd-role-title h3 { margin: 2px 0 4px; font-size: 15px; }
        .scd-role-title span { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 3; -webkit-box-orient: vertical; color: var(--scd-muted); font-size: 15px; line-height: 1.45; }

        .scd-role-fit {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 16px;
          padding: 10px;
          border-radius: 16px;
          background: rgba(255,255,255,.024);
        }

        .scd-alignment-ring {
          --scd-ring: 0deg;
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: conic-gradient(#6cc7ff var(--scd-ring), rgba(255,255,255,.08) 0deg);
          position: relative;
          flex: 0 0 auto;
        }

        .scd-alignment-ring::after {
          content: '';
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: #1a2840;
          box-shadow: inset 0 2px 5px rgba(0,0,0,.22);
        }

        .scd-alignment-ring-inner { position: relative; z-index: 1; text-align: center; }
        .scd-alignment-ring-inner strong { display: block; font-size: 15px; }
        .scd-alignment-ring-inner span { display: block; margin-top: -1px; color: #8fe8ff; font-size: 15px; text-transform: uppercase; letter-spacing: .1em; }

        .scd-role-fit small { display: block; color: var(--scd-soft); font-size: 15px; }
        .scd-role-fit strong { display: block; margin-top: 4px; font-size: 15px; }

        .scd-role-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5px;
          margin-top: 12px;
        }

        .scd-role-meta span {
          padding: 8px 5px;
          border-radius: 12px;
          background: rgba(255,255,255,.022);
          color: var(--scd-muted);
          font-size: 15px;
          text-align: center;
        }

        .scd-role-meta b { display: block; color: #eaf2ff; font-size: 15px; margin-bottom: 2px; }

        .scd-link-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 14px;
          padding: 0;
          border: 0;
          color: #acd2ff;
          background: transparent;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .scd-jobs { display: grid; gap: 10px; }

        .scd-job-row {
          display: grid;
          grid-template-columns: 44px minmax(0,1fr) 76px 34px;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border-radius: 19px;
          background: rgba(255,255,255,.024);
        }

        .scd-company-mark {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          color: #dbeaff;
          background: linear-gradient(145deg, rgba(95,151,236,.33), rgba(88,70,177,.22));
          border: 1px solid rgba(165,201,255,.1);
          font-size: 15px;
          font-weight: 850;
        }

        .scd-job-title-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .scd-job-title-line h3 { margin: 0; font-size: 15px; }
        .scd-job-main p { margin: 3px 0 5px; color: var(--scd-muted); font-size: 15px; }

        .scd-job-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .scd-job-tags span { padding: 4px 6px; border-radius: 7px; background: rgba(255,255,255,.035); color: #86dcff; font-size: 15px; }

        .scd-score-badge { padding: 6px 8px; border-radius: 9px; font-size: 15px; font-weight: 850; white-space: nowrap; }
        .scd-score-high { color: #9af0dc; background: rgba(74,193,159,.11); }
        .scd-score-mid { color: #c7d7ff; background: rgba(101,137,224,.12); }
        .scd-score-low { color: #ffb0b0; background: rgba(255,122,122,.1); }

        .scd-job-gap { text-align: center; }
        .scd-job-gap strong { display: block; font-size: 15px; }
        .scd-job-gap span { display: block; color: #80dfff; font-size: 15px; }

        .scd-icon-action {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 11px;
          color: #9ee8ff;
          background: rgba(255,255,255,.03);
          cursor: pointer;
        }

        .scd-analysis-card { min-height: 182px; }
        .scd-analysis-status { display: grid; grid-template-columns: 14px minmax(0,1fr); gap: 12px; }

        .scd-analysis-dot {
          width: 10px;
          height: 10px;
          margin-top: 4px;
          border-radius: 50%;
          background: #69e6cd;
          box-shadow: 0 0 12px rgba(105,230,205,.55);
        }

        .scd-analysis-dot.empty { background: #71819b; box-shadow: none; }

        .scd-analysis-status h3 { margin: 0; font-size: 15px; }
        .scd-analysis-status p { margin: 6px 0 0; color: var(--scd-muted); font-size: 15px; line-height: 1.5; }

        .scd-analysis-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
          margin-top: 18px;
        }

        .scd-analysis-meta div {
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255,255,255,.025);
        }

        .scd-analysis-meta span { display: block; color: #79dfff; font-size: 15px; }
        .scd-analysis-meta strong { display: block; margin-top: 4px; font-size: 15px; }

        .scd-quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        .scd-quick-card {
          min-height: 108px;
          padding: 14px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 18px;
          background: rgba(255,255,255,.024);
          cursor: pointer;
          text-align: left;
          color: inherit;
        }

        .scd-quick-card:hover { background: rgba(255,255,255,.038); }
        .scd-quick-card .icon { color: #86bcff; }
        .scd-quick-card strong { display: block; margin-top: 9px; font-size: 15px; }
        .scd-quick-card span { display: block; margin-top: 5px; color: var(--scd-muted); font-size: 15px; line-height: 1.4; }

        .scd-empty {
          min-height: 156px;
          display: grid;
          place-items: center;
          padding: 26px;
          text-align: center;
          border-radius: 20px;
          background: rgba(255,255,255,.023);
          border: 1px dashed rgba(255,255,255,.09);
        }

        .scd-empty h3 { margin: 0; font-size: 15px; }
        .scd-empty p { max-width: 420px; margin: 8px 0 14px; color: var(--scd-muted); font-size: 15px; line-height: 1.5; }

        .scd-search-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .scd-search {
          flex: 1;
          min-height: 42px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 13px;
          border-radius: 15px;
          border: 1px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.024);
          color: #8edfff;
        }

        .scd-search input {
          width: 100%;
          border: 0;
          outline: 0;
          color: #edf4ff;
          background: transparent;
          font: inherit;
          font-size: 15px;
        }

        .scd-search input::placeholder { color: #7fdfff; }

        .scd-profile-freshness {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          border-radius: 15px;
          border: 1px solid rgba(255,255,255,.06);
          background: rgba(255,255,255,.024);
          color: var(--scd-muted);
          font-size: 15px;
          white-space: nowrap;
        }

        .scd-profile-freshness i { width: 7px; height: 7px; border-radius: 50%; background: #69e6cd; box-shadow: 0 0 10px rgba(105,230,205,.5); }

        .scd-toast {
          position: fixed;
          right: 28px;
          bottom: 28px;
          z-index: 40;
          min-width: 250px;
          padding: 13px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.08);
          background: linear-gradient(145deg,#34435f,#222e45);
          color: #fff;
          box-shadow: 0 16px 34px rgba(0,0,0,.35);
          font-size: 15px;
          font-weight: 700;
        }

        .scd-loading {
          display: grid;
          place-items: center;
          min-height: 220px;
          border-radius: 22px;
          color: var(--scd-muted);
          text-align: center;
        }

        .scd-loader {
          width: 34px;
          height: 34px;
          margin-bottom: 10px;
          border: 3px solid rgba(255,255,255,.12);
          border-top-color: #72b8ff;
          border-radius: 50%;
          animation: scd-spin .8s linear infinite;
        }

        @keyframes scd-spin { to { transform: rotate(360deg); } }
        @keyframes scd-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 1200px) {
          .scd-hero { grid-template-columns: 1fr; }
          .scd-stat-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .scd-role-list { grid-template-columns: 1fr; }
        }

        @media (max-width: 900px) {
          .scd-main-grid { grid-template-columns: 1fr; }
          .scd-section.wide { grid-column: auto; }
        }

        @media (max-width: 620px) {
          .scd-dashboard { padding-bottom: 20px; }
          .scd-hero-main { min-height: auto; padding: 24px; border-radius: 24px; }
          .scd-hero-side, .scd-section { border-radius: 23px; padding: 18px; }
          .scd-stat-grid { grid-template-columns: 1fr; }
          .scd-source-grid, .scd-quick-grid { grid-template-columns: 1fr; }
          .scd-job-row { grid-template-columns: 40px minmax(0,1fr) 34px; }
          .scd-job-gap { display: none; }
          .scd-search-row { flex-direction: column; align-items: stretch; }
          .scd-profile-freshness { justify-content: center; }
        }

        /* Global SkillCompass theme alignment */
        .scd-dashboard {
          background: transparent;
        }

        .scd-hero-main,
        .scd-hero-side,
        .scd-section,
        .scd-role-card,
        .scd-job-row,
        .scd-stat-card {
          box-shadow: var(--sc-shadow-dashboard, var(--sc-shadow-card, 0 19px 34px rgba(0, 7, 20, .42)));
        }

        .scd-button {
          border-radius: var(--sc-radius-md);
          box-shadow: var(--sc-shadow-button);
        }

        .scd-button.primary {
          background: linear-gradient(135deg, var(--sc-blue), var(--sc-purple));
        }

        .scd-search,
        .scd-profile-freshness,
        .scd-quick-card,
        .scd-skill-row,
        .scd-role-meta span,
        .scd-role-fit,
        .scd-analysis-meta div,
        .scd-source-tile {
          border-color: var(--sc-line);
        }

        @media (prefers-reduced-motion: reduce) {
          .scd-hero-main::before,
          .scd-loader,
          .scd-role-card,
          .scd-button,
          .scd-quick-card {
            animation: none !important;
            transition: none !important;
          }
        }



        /* ===== Dashboard readability pass =====
           Keep the existing structure and behavior, but enforce the shared
           SkillCompass visual language: bright blue-tinted copy and 12px minimum
           readable text across all Dashboard supporting labels/copy. */
        .scd-dashboard {
          --scd-muted: #a9efff;
          --scd-soft: #c8f6ff;
        }

        .scd-dashboard .scd-eyebrow,
        .scd-dashboard .scd-status,
        .scd-dashboard .scd-section-kicker,
        .scd-dashboard .scd-mini-action,
        .scd-dashboard .scd-skill-label span,
        .scd-dashboard .scd-role-rank,
        .scd-dashboard .scd-domain-pill,
        .scd-dashboard .scd-link-button,
        .scd-dashboard .scd-job-tags span,
        .scd-dashboard .scd-score-badge,
        .scd-dashboard .scd-job-gap span,
        .scd-dashboard .scd-search,
        .scd-dashboard .scd-profile-freshness,
        .scd-dashboard .scd-toast,
        .scd-dashboard .scd-analysis-meta span {
          font-size: 15px !important;
        }

        .scd-dashboard .scd-stat-copy small,
        .scd-dashboard .scd-source-tile .label,
        .scd-dashboard .scd-source-tile small,
        .scd-dashboard .scd-role-title span,
        .scd-dashboard .scd-alignment-ring-inner span,
        .scd-dashboard .scd-role-fit small,
        .scd-dashboard .scd-role-meta span,
        .scd-dashboard .scd-role-meta b,
        .scd-dashboard .scd-role-mark,
        .scd-dashboard .scd-company-mark,
        .scd-dashboard .scd-job-main p,
        .scd-dashboard .scd-analysis-status p,
        .scd-dashboard .scd-analysis-meta strong,
        .scd-dashboard .scd-quick-card strong,
        .scd-dashboard .scd-quick-card span,
        .scd-dashboard .scd-empty p,
        .scd-dashboard .scd-search input {
          font-size: 15px !important;
        }

        .scd-dashboard .scd-eyebrow { color: #86c5ff; }
        .scd-dashboard .scd-status { color: #8ff0d5; }
        .scd-dashboard .scd-status.offline { color: #ffb8b8; }
        .scd-dashboard .scd-section-kicker { color: #8ac0ff; }
        .scd-dashboard .scd-mini-action { color: #9ed0ff; }
        .scd-dashboard .scd-source-tile .label { color: #b7d7f8; }
        .scd-dashboard .scd-source-tile small { color: #a9efff; }
        .scd-dashboard .scd-skill-label span { color: #b9d9f8; }
        .scd-dashboard .scd-role-rank { color: #83baff; }
        .scd-dashboard .scd-domain-pill { color: #b9d9f8; }
        .scd-dashboard .scd-role-title span { color: #a9efff; }
        .scd-dashboard .scd-alignment-ring-inner span { color: #a7c9e8; }
        .scd-dashboard .scd-role-fit small { color: #b7d7f5; }
        .scd-dashboard .scd-role-meta span { color: #bfdaf3; }
        .scd-dashboard .scd-role-meta b { color: #eef6ff; }
        .scd-dashboard .scd-link-button { color: #a8d4ff; }
        .scd-dashboard .scd-job-main p { color: #a9efff; }
        .scd-dashboard .scd-job-tags span { color: #b8d7f4; }
        .scd-dashboard .scd-job-gap span { color: #b6d2ec; }
        .scd-dashboard .scd-analysis-status p { color: #a9efff; }
        .scd-dashboard .scd-analysis-meta span { color: #a9c8e7; }
        .scd-dashboard .scd-analysis-meta strong { color: #e4f1ff; }
        .scd-dashboard .scd-quick-card strong { color: #eef6ff; }
        .scd-dashboard .scd-quick-card span { color: #c1daf2; }
        .scd-dashboard .scd-empty p { color: #a9efff; }
        .scd-dashboard .scd-search { color: #a8d1f5; }
        .scd-dashboard .scd-search input { color: #edf6ff; }
        .scd-dashboard .scd-search input::placeholder { color: #a8c9e7; }
        .scd-dashboard .scd-profile-freshness { color: #c1dbf2; }
        .scd-dashboard .scd-toast { color: #f4f8ff; }

      `}</style>

      <main className="main-area scd-dashboard">
        <div className="scd-search-row">
          <label className="scd-search" htmlFor="scd-dashboard-search">
            <SvgIcon name="search" size={18} />
            <input
              id="scd-dashboard-search"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search your skills, career directions, or opportunities..."
            />
          </label>

          <div className="scd-profile-freshness">
            <i />
            {data.analysis ? `Profile updated ${formatRelative(data.analysis.completedAt)}` : 'Current profile ready'}
          </div>
        </div>

        {loadState === 'loading' ? (
          <section className="scd-section scd-loading">
            <div>
              <div className="scd-loader" aria-hidden="true" />
              <strong>Building your career intelligence...</strong>
              <p>Loading your current skills, career directions, and opportunities.</p>
            </div>
          </section>
        ) : (
          <>
            <section className="scd-hero">
              <div className="scd-hero-main">
                <span className="scd-eyebrow"><SvgIcon name="sparkle" size={14} /> SkillCompass Overview</span>
                <h1>Your career intelligence,<br />grounded in what you actually know.</h1>
                <p>
                  Your dashboard now reflects your current persisted skill profile,
                  the career directions it supports, and real openings that match
                  the strongest direction in your profile.
                </p>

                <div className="scd-hero-actions">
                  <ClayButton className="primary" onClick={() => navigate('/job-profiles')}>
                    Explore Career Directions <SvgIcon name="arrow" size={16} />
                  </ClayButton>
                  <ClayButton className="ghost" onClick={() => navigate('/github')}>
                    Open GitHub Workspace
                  </ClayButton>
                </div>
              </div>

              <aside className="scd-hero-side">
                <div className="scd-identity">
                  <div className="scd-avatar">
                    <img src={avatarReference} alt="Profile" />
                  </div>
                  <div>
                    <strong>{firstName}</strong>
                    <span>Current Skill Profile</span>
                  </div>
                </div>

                <div className="scd-source-grid">
                  <div className="scd-source-tile">
                    <span className="label">GitHub</span>
                    <strong>{cachedGithub.repositories.length}</strong>
                    <small>{githubConnected ? 'repositories synced' : 'connect to sync'}</small>
                  </div>
                  <div className="scd-source-tile">
                    <span className="label">Skill signals</span>
                    <strong>{data.skills.length}</strong>
                    <small>current profile entries</small>
                  </div>
                </div>

                <div className={`scd-status ${githubConnected ? '' : 'offline'}`}>
                  <i />
                  {githubConnected ? 'GitHub connected' : 'GitHub not connected'}
                </div>
              </aside>
            </section>

            <section className="scd-stat-grid" aria-label="Current profile summary">
              <StatCard
                icon="code"
                value={String(data.skills.length)}
                label="Current Skills"
                detail="Persisted skills available to SkillCompass"
                tone="blue"
              />
              <StatCard
                icon="chart"
                value={formatScore(averageProficiency)}
                label="Average Proficiency"
                detail="Across your current skill signals"
                tone="mint"
              />
              <StatCard
                icon="briefcase"
                value={String(data.profiles.length ? Math.min(12, data.profiles.length) : 0)}
                label="Career Directions"
                detail="Role directions available to explore"
                tone="purple"
              />
              <StatCard
                icon="target"
                value={String(skillGapCount)}
                label="Top Role Gaps"
                detail={topRole ? `For ${topRole.title}` : 'Choose a role to explore'}
                tone="coral"
              />
            </section>

            <section className="scd-main-grid">
              <article className="scd-section">
                <div className="scd-section-head">
                  <div>
                    <span className="scd-section-kicker">CURRENT PROFILE</span>
                    <h2>Your strongest skills</h2>
                    <p>What SkillCompass currently has persisted for your profile.</p>
                  </div>
                  <button className="scd-mini-action" type="button" onClick={() => navigate('/skills')}>
                    View all
                  </button>
                </div>

                {visibleSkills.length ? (
                  <div className="scd-skill-list">
                    {visibleSkills.map(skill => <SkillBar key={skill.name} skill={skill} />)}
                  </div>
                ) : (
                  <div className="scd-empty">
                    <div>
                      <h3>No current skill signals yet</h3>
                      <p>Connect GitHub and run repository analysis to build your current skill profile.</p>
                      <ClayButton className="primary" onClick={() => navigate('/github')}>Connect GitHub</ClayButton>
                    </div>
                  </div>
                )}
              </article>

              <article className="scd-section">
                <div className="scd-section-head">
                  <div>
                    <span className="scd-section-kicker">ANALYSIS HISTORY</span>
                    <h2>Latest profile update</h2>
                    <p>Analysis remains historical; this card only shows your latest update context.</p>
                  </div>
                  <button className="scd-mini-action" type="button" onClick={() => navigate('/analysis')}>
                    History
                  </button>
                </div>

                <div className="scd-analysis-card">
                  <div className="scd-analysis-status">
                    <div className={`scd-analysis-dot ${data.analysis ? '' : 'empty'}`} />
                    <div>
                      <h3>{data.analysis ? 'Latest analysis completed' : 'No completed analysis found'}</h3>
                      <p>
                        {data.analysis
                          ? 'Your analysis produced the current persisted skill and proficiency state used by the rest of SkillCompass.'
                          : 'Your dashboard can still explore the role catalog, but a current skill profile has not been established yet.'}
                      </p>
                    </div>
                  </div>

                  <div className="scd-analysis-meta">
                    <div>
                      <span>STATUS</span>
                      <strong>{data.analysis?.status ?? 'NOT AVAILABLE'}</strong>
                    </div>
                    <div>
                      <span>COMPLETED</span>
                      <strong>{data.analysis ? formatDateTime(data.analysis.completedAt) : 'Not available'}</strong>
                    </div>
                  </div>
                </div>
              </article>

              <article className="scd-section wide">
                <div className="scd-section-head">
                  <div>
                    <span className="scd-section-kicker">CAREER DIRECTIONS</span>
                    <h2>Roles your current profile can explore</h2>
                    <p>These are directional role profiles, not individual job openings.</p>
                  </div>
                  <button className="scd-mini-action" type="button" onClick={() => navigate('/job-profiles')}>
                    Open Job Profiles
                  </button>
                </div>

                {visibleRoles.length ? (
                  <div className="scd-role-list">
                    {visibleRoles.map((profile, index) => (
                      <RoleCard
                        key={profile.slug}
                        profile={profile}
                        index={index}
                        onOpen={() => navigate(`/job-profiles/${encodeURIComponent(profile.slug)}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="scd-empty">
                    <div>
                      <h3>No matching career direction</h3>
                      <p>Try another search term or browse the full role catalog.</p>
                      <ClayButton className="ghost" onClick={() => setQuery('')}>Clear search</ClayButton>
                    </div>
                  </div>
                )}
              </article>

              <article className="scd-section wide">
                <div className="scd-section-head">
                  <div>
                    <span className="scd-section-kicker">ACTUAL OPPORTUNITIES</span>
                    <h2>{topRole ? `Openings for ${topRole.title}` : 'Actual job openings'}</h2>
                    <p>
                      {topRole
                        ? 'These openings are classified under the strongest current career direction and matched against your current UserSkill profile.'
                        : 'Choose a career direction to evaluate actual openings against your current skill profile.'}
                    </p>
                  </div>
                  {topRole && (
                    <button className="scd-mini-action" type="button" onClick={() => navigate(`/job-recommendations/${encodeURIComponent(topRole.slug)}`)}>
                      View recommendations
                    </button>
                  )}
                </div>

                {visibleJobs.length ? (
                  <div className="scd-jobs">
                    {visibleJobs.map(recommendation => (
                      <JobRow key={recommendation.jobId} recommendation={recommendation} />
                    ))}
                  </div>
                ) : (
                  <div className="scd-empty">
                    <div>
                      <h3>{topRole ? 'No current openings surfaced' : 'No opportunity set yet'}</h3>
                      <p>
                        {topRole
                          ? `No openings are currently available in the ${topRole.title} result set. Refresh the job catalog or open the recommendations page for the full view.`
                          : 'Explore Job Profiles first. Job Recommendations will then evaluate actual openings for that direction.'}
                      </p>
                      <ClayButton
                        className="primary"
                        onClick={() => navigate(topRole ? `/job-recommendations/${encodeURIComponent(topRole.slug)}` : '/job-profiles')}
                      >
                        {topRole ? 'Open Recommendations' : 'Explore Job Profiles'}
                      </ClayButton>
                    </div>
                  </div>
                )}
              </article>

              <article className="scd-section wide">
                <div className="scd-section-head">
                  <div>
                    <span className="scd-section-kicker">NEXT ACTIONS</span>
                    <h2>Keep moving through the SkillCompass workflow</h2>
                    <p>Each action maps to a feature that is actually implemented in the product.</p>
                  </div>
                </div>

                <div className="scd-quick-grid">
                  <button className="scd-quick-card" type="button" onClick={() => navigate('/github')}>
                    <span className="icon"><SvgIcon name="github" size={21} /></span>
                    <strong>{githubConnected ? 'Review GitHub workspace' : 'Connect GitHub'}</strong>
                    <span>{githubConnected ? 'Inspect synced repositories and start another analysis.' : 'Connect your repositories to build your current profile.'}</span>
                  </button>

                  <button className="scd-quick-card" type="button" onClick={() => navigate('/analysis')}>
                    <span className="icon"><SvgIcon name="chart" size={21} /></span>
                    <strong>Review analysis</strong>
                    <span>Open historical analysis runs and inspect repository intelligence.</span>
                  </button>

                  <button className="scd-quick-card" type="button" onClick={() => navigate('/job-profiles')}>
                    <span className="icon"><SvgIcon name="briefcase" size={21} /></span>
                    <strong>Explore career directions</strong>
                    <span>Discover role-level skill requirements from your current profile.</span>
                  </button>

                  <button className="scd-quick-card" type="button" onClick={() => {
                    if (topRole) {
                      navigate(`/job-recommendations/${encodeURIComponent(topRole.slug)}`);
                    } else {
                      showToast('Choose a career direction first.');
                    }
                  }}>
                    <span className="icon"><SvgIcon name="target" size={21} /></span>
                    <strong>Find actual opportunities</strong>
                    <span>Compare your current skills against real openings and their specific gaps.</span>
                  </button>
                </div>
              </article>
            </section>
          </>
        )}

        {toast && <div className="scd-toast" role="status">{toast}</div>}
      </main>
    </>
  );
}
