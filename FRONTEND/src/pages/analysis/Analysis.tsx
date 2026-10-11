import { useEffect, useMemo, useState } from 'react';
import { SvgIcon } from '../../components/icons/SvgIcon';
import {
  getAnalysisLatestRun,
  getAnalysisResult,
  type AnalysisResult,
  type AnalysisSkill,
  type AnalysisSnapshot,
} from '../../api/analysis';
import { navigate } from '../../router/appRouter';
import './analysis.css';

interface Props {
  analysisRunId?: string;
}

type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

const LEVEL_LABELS: Record<Level, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

function formatDate(value?: string | null) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function levelLabel(value?: string | null) {
  const normalized = String(value ?? '').trim().toUpperCase() as Level;
  return LEVEL_LABELS[normalized] ?? (value || 'Unclassified');
}

function scoreOf(skill: AnalysisSkill) {
  return clamp(Number(skill.score ?? 0));
}

function confidenceOf(skill: AnalysisSkill) {
  const raw = Number(skill.confidence ?? 0);
  return clamp(raw <= 1 ? raw * 100 : raw);
}

function uniqueByName<T extends { name?: string; normalizedName?: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = String(item.normalizedName ?? item.name ?? '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function iconMark(name: string, index: number) {
  const normalized = name.toLowerCase();
  if (normalized.includes('typescript')) return 'TS';
  if (normalized.includes('javascript')) return 'JS';
  if (normalized === 'react') return '⚛';
  if (normalized.includes('node')) return 'N';
  if (normalized.includes('python')) return 'Py';
  if (normalized.includes('java')) return 'J';
  if (normalized.includes('docker')) return 'D';
  if (normalized.includes('postgres')) return 'PG';
  if (normalized.includes('mongodb')) return 'DB';
  return name.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || `S${index + 1}`;
}

export default function Analysis({ analysisRunId }: Props) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const resolvedRunId = analysisRunId || (await getAnalysisLatestRun()).id;
      const data = await getAnalysisResult(resolvedRunId);
      setResult(data);
      setSelectedSkillId(current =>
        current && data.skills.some(skill => skill.id === current) ? current : (data.skills[0]?.id ?? null),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the analysis result.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, [analysisRunId]);

  const skills = useMemo(() => {
    if (!result) return [];
    return [...result.skills].sort((a, b) => scoreOf(b) - scoreOf(a));
  }, [result]);

  const visibleSkills = showAllSkills ? skills : skills.slice(0, 8);

  const proficiencyDistribution = useMemo(() => {
    const counts: Record<Level, number> = {
      BEGINNER: 0,
      INTERMEDIATE: 0,
      ADVANCED: 0,
      EXPERT: 0,
    };

    for (const skill of skills) {
      const level = String(skill.level ?? '').toUpperCase() as Level;
      if (level in counts) counts[level] += 1;
    }

    return counts;
  }, [skills]);

  const averageScore = useMemo(() => {
    if (!skills.length) return 0;
    return Math.round(skills.reduce((sum, skill) => sum + scoreOf(skill), 0) / skills.length);
  }, [skills]);

  const technologies = useMemo(() => {
    if (!result) return [];
    return uniqueByName(result.technologies).slice(0, 18);
  }, [result]);

  const selectedSkill = useMemo(
    () => skills.find(skill => skill.id === selectedSkillId) ?? skills[0] ?? null,
    [skills, selectedSkillId],
  );

  if (loading) {
    return (
      <main className="analysis-page">
        <AnalysisHero loading />
        <section className="analysis-skeleton-metrics" aria-hidden="true">
          {[0, 1, 2, 3].map(item => <div className="analysis-skeleton" key={item} />)}
        </section>
        <div className="analysis-skeleton-grid" aria-hidden="true">
          <div className="analysis-skeleton panel-large" />
          <div className="analysis-skeleton panel-large" />
        </div>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="analysis-page">
        <AnalysisHero />
        <section className="analysis-state">
          <div className="analysis-state-icon"><SvgIcon name="alert" size={28} /></div>
          <h2>Couldn’t load this analysis</h2>
          <p>{error || 'No completed analysis result is available.'}</p>
          <div className="analysis-state-actions">
            <button type="button" className="analysis-primary-action" onClick={() => void load()}>
              <SvgIcon name="refresh" size={18} />
              Try again
            </button>
            <button type="button" className="analysis-secondary-action" onClick={() => navigate('/analysis-history')}>
              <SvgIcon name="arrow" size={17} />
              Back to history
            </button>
          </div>
        </section>
      </main>
    );
  }

  const snapshotCount = result.snapshots.length || (result.repository ? 1 : 0);
  const evidenceCount = result.technologies.length;
  const run = result.analysisRun;

  return (
    <main className="analysis-page">
      <AnalysisHero
        repositoryName={result.repository?.name}
        completedAt={run.completedAt}
        status={run.status}
        onRefresh={() => void load(true)}
        refreshing={refreshing}
      />

      <section className="analysis-metrics" aria-label="Analysis summary">
        <MetricCard icon="layers" value={skills.length} label="Skills detected" tone="blue" />
        <MetricCard icon="chart" value={`${averageScore}%`} label="Average proficiency" tone="mint" />
        <MetricCard icon="repo" value={snapshotCount} label="Repositories analyzed" tone="purple" />
        <MetricCard icon="sparkle" value={evidenceCount} label="Evidence signals" tone="cyan" />
      </section>

      <section className="analysis-main-grid">
        <article className="analysis-panel analysis-skill-profile">
          <PanelHeader
            eyebrow="Skill Profile"
            title="Your strongest signals"
            copy="Skills surfaced from the evidence captured in this analysis run."
          />

          <div className="analysis-skill-list">
            {visibleSkills.length ? visibleSkills.map((skill, index) => (
              <button
                type="button"
                key={skill.id}
                className={`analysis-skill-row ${selectedSkill?.id === skill.id ? 'selected' : ''}`}
                onClick={() => setSelectedSkillId(skill.id)}
              >
                <span className={`analysis-skill-mark tone-${index % 5}`}>
                  {iconMark(skill.name, index)}
                </span>

                <span className="analysis-skill-copy">
                  <strong>{skill.name}</strong>
                  <small
                    style={{
                      color: '#d2e1f4',
                      fontSize: '18px',
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    {skill.category || 'Detected skill'}
                  </small>
                </span>

                <span className="analysis-progress">
                  <i style={{ width: `${scoreOf(skill)}%` }} />
                </span>

                <strong className="analysis-score">{Math.round(scoreOf(skill))}%</strong>

                <span className={`analysis-level level-${String(skill.level ?? '').toLowerCase()}`}>
                  {levelLabel(skill.level)}
                </span>
              </button>
            )) : (
              <EmptyInline icon="layers" copy="No skills were returned by this analysis." />
            )}
          </div>

          {skills.length > 8 && (
            <button
              type="button"
              className="analysis-view-all"
              onClick={() => setShowAllSkills(value => !value)}
            >
              {showAllSkills ? 'Show fewer skills' : `View all ${skills.length} skills`}
              <SvgIcon name={showAllSkills ? 'chevron' : 'arrow'} size={16} />
            </button>
          )}
        </article>

        <article className="analysis-panel analysis-distribution">
          <PanelHeader
            eyebrow="Proficiency"
            title="How your skills are distributed"
            copy="A snapshot of the proficiency levels assigned in this run."
          />

          <div className="analysis-donut-wrap">
            <div
              className="analysis-donut"
              style={{
                background: `conic-gradient(
                  #43e2ad 0deg ${((proficiencyDistribution.EXPERT / Math.max(skills.length, 1)) * 360)}deg,
                  #418dff ${((proficiencyDistribution.EXPERT / Math.max(skills.length, 1)) * 360)}deg ${(((proficiencyDistribution.EXPERT + proficiencyDistribution.ADVANCED) / Math.max(skills.length, 1)) * 360)}deg,
                  #ffb15a ${(((proficiencyDistribution.EXPERT + proficiencyDistribution.ADVANCED) / Math.max(skills.length, 1)) * 360)}deg ${(((proficiencyDistribution.EXPERT + proficiencyDistribution.ADVANCED + proficiencyDistribution.INTERMEDIATE) / Math.max(skills.length, 1)) * 360)}deg,
                  #ee669d ${(((proficiencyDistribution.EXPERT + proficiencyDistribution.ADVANCED + proficiencyDistribution.INTERMEDIATE) / Math.max(skills.length, 1)) * 360)}deg 360deg
                )`,
              }}
            >
              <div className="analysis-donut-hole">
                <strong>{skills.length}</strong>
                <span>Total skills</span>
              </div>
            </div>

            <div className="analysis-distribution-list">
              <DistributionRow level="EXPERT" count={proficiencyDistribution.EXPERT} />
              <DistributionRow level="ADVANCED" count={proficiencyDistribution.ADVANCED} />
              <DistributionRow level="INTERMEDIATE" count={proficiencyDistribution.INTERMEDIATE} />
              <DistributionRow level="BEGINNER" count={proficiencyDistribution.BEGINNER} />
            </div>
          </div>
        </article>
      </section>

      <section className="analysis-panel analysis-intelligence">
        <PanelHeader
          eyebrow="Skill Intelligence"
          title="Detailed proficiency results"
          copy="Open a skill to see its score, confidence, and supporting evidence."
        />

        <div className="analysis-table">
          <div className="analysis-table-head">
            <span>Skill</span>
            <span>Category</span>
            <span>Proficiency</span>
            <span>Confidence</span>
            <span>Evidence</span>
          </div>

          {skills.map(skill => (
            <button
              type="button"
              key={skill.id}
              className={`analysis-table-row ${selectedSkill?.id === skill.id ? 'selected' : ''}`}
              onClick={() => setSelectedSkillId(skill.id)}
            >
              <span className="analysis-table-skill">
                <i>{iconMark(skill.name, skills.indexOf(skill))}</i>
                <strong>{skill.name}</strong>
              </span>
              <span>{skill.category || '—'}</span>
              <span>
                <b className={`analysis-level level-${String(skill.level ?? '').toLowerCase()}`}>
                  {levelLabel(skill.level)}
                </b>
                <em>{Math.round(scoreOf(skill))}%</em>
              </span>
              <span>{Math.round(confidenceOf(skill))}%</span>
              <span>{skill.evidence.length}</span>
            </button>
          ))}
        </div>

        {selectedSkill && (
          <div className="analysis-selected-skill">
            <div className="analysis-selected-head">
              <div>
                <span className="analysis-section-kicker">Selected skill</span>
                <h3>{selectedSkill.name}</h3>
                <p>{selectedSkill.description || 'Skill surfaced from repository evidence in this analysis.'}</p>
              </div>
              <div className="analysis-selected-score">
                <strong>{Math.round(scoreOf(selectedSkill))}%</strong>
                <span>{levelLabel(selectedSkill.level)}</span>
              </div>
            </div>

            <div className="analysis-selected-meta">
              <span>Confidence <b>{Math.round(confidenceOf(selectedSkill))}%</b></span>
              <span>Evidence <b>{selectedSkill.evidence.length}</b></span>
              <span>Category <b>{selectedSkill.category || '—'}</b></span>
            </div>

            {selectedSkill.evidence.length ? (
              <div className="analysis-evidence-list">
                {selectedSkill.evidence.slice(0, 6).map((evidence, index) => (
                  <div className="analysis-evidence-item" key={`${evidence.id ?? evidence.name}-${index}`}>
                    <span><SvgIcon name="sparkle" size={16} /></span>
                    <div>
                      <strong>{evidence.name}</strong>
                      <small>{evidence.reasoning || evidence.evidenceValue || evidence.evidenceType || 'Supporting evidence'}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyInline icon="file" copy="No detailed evidence was attached to this skill in the returned result." />
            )}
          </div>
        )}
      </section>

      <section className="analysis-panel analysis-methodology">
        <div className="analysis-methodology-copy">
          <span className="analysis-section-kicker">How SkillCompass reads your work</span>
          <h2>The result is built from evidence, not a single signal.</h2>
          <p>
            SkillCompass uses the analyzed repository snapshot to identify technology evidence, connect that evidence to skills,
            and then surface a proficiency estimate with a confidence signal. The calculation itself stays behind the product
            boundary; this view focuses on what was observed and what the resulting assessment says.
          </p>
        </div>

        <div className="analysis-methodology-flow" aria-label="Analysis methodology">
          <FlowStep icon="repo" label="Repository" />
          <FlowArrow />
          <FlowStep icon="code" label="Technology evidence" />
          <FlowArrow />
          <FlowStep icon="layers" label="Skill extraction" />
          <FlowArrow />
          <FlowStep icon="chart" label="Proficiency estimate" />
        </div>

        {result.methodologyVersion && (
          <div className="analysis-methodology-version">
            <span>Methodology</span>
            <strong>{result.methodologyVersion}</strong>
          </div>
        )}
      </section>

      <section className="analysis-secondary-grid">
        <article className="analysis-panel">
          <PanelHeader
            eyebrow="Technology Stack"
            title="What appeared in your repositories"
            copy="Technologies retained as evidence during the selected run."
          />

          <div className="analysis-tech-cloud">
            {technologies.length ? technologies.map((technology, index) => (
              <span className={`analysis-tech-pill tone-${index % 5}`} key={`${technology.normalizedName ?? technology.name}-${index}`}>
                <i>{iconMark(technology.name, index)}</i>
                {technology.name}
              </span>
            )) : (
              <EmptyInline icon="code" copy="No technology evidence was returned." />
            )}
          </div>
        </article>

        <article className="analysis-panel">
          <PanelHeader
            eyebrow="Analysis Coverage"
            title="What this run examined"
            copy="The footprint represented by the returned analysis result."
          />

          <div className="analysis-coverage-list">
            <CoverageRow label="Repository snapshots" value={snapshotCount} />
            <CoverageRow label="Technology evidence" value={evidenceCount} />
            <CoverageRow label="Skills assessed" value={skills.length} />
            <CoverageRow label="Completed" value={formatDateTime(run.completedAt)} />
          </div>

          {run.createdAt && (
            <div className="analysis-run-footnote">
              Run created {formatDate(run.createdAt)} · {run.id.slice(0, 8)}…
            </div>
          )}
        </article>
      </section>

      <section className="analysis-panel analysis-repositories">
        <PanelHeader
          eyebrow="Repository Evidence"
          title="Where the signals came from"
          copy="A compact view of the snapshots attached to this analysis."
        />

        {result.snapshots.length ? (
          <div className="analysis-repository-grid">
            {result.snapshots.map((snapshot, index) => (
              <RepositoryEvidenceCard key={snapshot.id ?? `${snapshot.repository?.id}-${index}`} snapshot={snapshot} />
            ))}
          </div>
        ) : (
          <EmptyInline icon="repo" copy={result.repository ? 'Repository snapshot details were not included in the returned result.' : 'No repository evidence was returned.'} />
        )}
      </section>
    </main>
  );
}

function AnalysisHero({
  repositoryName,
  completedAt,
  status,
  onRefresh,
  refreshing,
  loading = false,
}: {
  repositoryName?: string;
  completedAt?: string | null;
  status?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
}) {
  return (
    <header className="analysis-header">
      <div className="analysis-hero-main">
        <div className="analysis-hero-icon" aria-hidden="true">
          <SvgIcon name="chart" size={52} />
        </div>

        <div className="analysis-hero-copy">
          <span className="analysis-eyebrow">Repository Intelligence</span>
          <h1><span>Technical</span> <em>Analysis</em></h1>
          <p>
            {repositoryName
              ? `A focused readout of what SkillCompass discovered in ${repositoryName}.`
              : 'A focused readout of the skills, proficiency signals, and repository evidence found in your analysis.'}
          </p>

          <div className="analysis-hero-meta">
            <span><i className="analysis-live-dot" />{status === 'COMPLETED' || !status ? 'Analysis complete' : status}</span>
            {completedAt && <small>Completed {formatDate(completedAt)}</small>}
          </div>
        </div>
      </div>

      <div className="analysis-hero-art" aria-hidden="true">
        <div className="analysis-quote">
          <span>“</span>
          <p>Your code tells a story.<br />Let’s turn it into clarity.</p>
          <b>”</b>
        </div>
        <div className="analysis-orbit orbit-one" />
        <div className="analysis-orbit orbit-two" />
        <div className="analysis-hero-sphere sphere-one" />
        <div className="analysis-hero-sphere sphere-two" />
        {onRefresh && (
          <button
            type="button"
            className="analysis-hero-refresh"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh analysis"
          >
            <SvgIcon name={refreshing ? 'loader' : 'refresh'} size={17} />
          </button>
        )}
      </div>

      {loading && <div className="analysis-hero-loading-line" />}
    </header>
  );
}

function MetricCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: string;
  value: string | number;
  label: string;
  tone: string;
}) {
  return (
    <article className={`analysis-metric tone-${tone}`}>
      <span className="analysis-metric-icon"><SvgIcon name={icon} size={22} /></span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </article>
  );
}

function PanelHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="analysis-panel-head">
      <div>
        <span className="analysis-section-kicker">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
    </div>
  );
}

function DistributionRow({ level, count }: { level: Level; count: number }) {
  return (
    <div className="analysis-distribution-row">
      <span><i className={`distribution-dot dot-${level.toLowerCase()}`} />{levelLabel(level)}</span>
      <strong>{count}</strong>
    </div>
  );
}

function FlowStep({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="analysis-flow-step">
      <span><SvgIcon name={icon} size={22} /></span>
      <strong>{label}</strong>
    </div>
  );
}

function FlowArrow() {
  return <span className="analysis-flow-arrow"><SvgIcon name="arrow" size={17} /></span>;
}

function CoverageRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="analysis-coverage-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RepositoryEvidenceCard({ snapshot }: { snapshot: AnalysisSnapshot }) {
  const languages = snapshot.languages.slice(0, 4);
  const techs = uniqueByName(snapshot.technologies).slice(0, 5);

  return (
    <article className="analysis-repository-card">
      <div className="analysis-repository-head">
        <span className="analysis-repository-icon"><SvgIcon name="repo" size={21} /></span>
        <div>
          <strong>{snapshot.repository?.name || snapshot.repository?.fullName || 'Repository snapshot'}</strong>
          <small>{snapshot.repository?.fullName || snapshot.repository?.defaultBranch || 'Captured repository evidence'}</small>
        </div>
      </div>

      {snapshot.commitSha && (
        <div className="analysis-commit">
          <span>Commit</span>
          <code>{snapshot.commitSha.slice(0, 10)}</code>
        </div>
      )}

      <div className="analysis-language-mini">
        {languages.map(language => (
          <span key={`${language.language}-${language.percentage}`}>
            {language.language}
            <b>{Math.round(Number(language.percentage ?? 0))}%</b>
          </span>
        ))}
      </div>

      <div className="analysis-repository-tech">
        {techs.map((technology, index) => (
          <span className={`analysis-small-tech tone-${index % 5}`} key={`${technology.normalizedName ?? technology.name}-${index}`}>
            {technology.name}
          </span>
        ))}
      </div>
    </article>
  );
}

function EmptyInline({ icon, copy }: { icon: string; copy: string }) {
  return (
    <div className="analysis-empty-inline">
      <SvgIcon name={icon} size={19} />
      <span>{copy}</span>
    </div>
  );
}
