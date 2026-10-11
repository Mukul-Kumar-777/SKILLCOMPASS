import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { SvgIcon } from '../icons/SvgIcon';
import { navigate } from '../../router/appRouter';

import type {
  Repository,
  RepositoryTab,
} from '../../types/github';

import type {
  RepositoryAnalysisResult,
} from '../../api/analysis';

import {
  getLatestRepositoryAnalysis,
} from '../../api/analysis';

interface Props {
  repository: Repository;

  onAnalyze: (
    id: string,
  ) => void;

  analyzing: boolean;
}

const tabs: RepositoryTab[] = [
  'Overview',
  'Languages',
  'Files',
  'Commits',
  'Analysis',
];

export default function RepositoryDetails({
  repository,
  onAnalyze,
  analyzing,
}: Props) {
  const [tab, setTab] =
    useState<RepositoryTab>(
      'Overview',
    );

  const [
    analysis,
    setAnalysis,
  ] =
    useState<RepositoryAnalysisResult | null>(
      null,
    );

  const [
    loadingAnalysis,
    setLoadingAnalysis,
  ] =
    useState(false);

  const [
    analysisError,
    setAnalysisError,
  ] =
    useState('');

  /* =======================================================
     LOAD ANALYSIS
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadAnalysis = async () => {
      setLoadingAnalysis(true);
      setAnalysisError('');

      try {
        const result =
          await getLatestRepositoryAnalysis(
            repository.id,
          );

        if (cancelled) {
          return;
        }

        setAnalysis(result);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAnalysis(null);

        setAnalysisError(
          error instanceof Error
            ? error.message
            : 'Unable to load analysis result.',
        );
      } finally {
        if (!cancelled) {
          setLoadingAnalysis(false);
        }
      }
    };

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [
    repository.id,
    repository.status,
  ]);

  /* =======================================================
     LANGUAGE DATA
     ======================================================= */

  const languageEntries =
    useMemo(() => {
      if (
        analysis &&
        analysis.languages.length
      ) {
        return analysis.languages
          .map(
            (language) => [
              language.name,
              language.percentage,
            ] as [string, number],
          );
      }

      return Object.entries(
        repository.languages,
      );
    }, [
      analysis,
      repository.languages,
    ]);

  /* =======================================================
     DISPLAY DATA
     ======================================================= */

  const fileCount =
    analysis?.fileCount ??
    repository.files ??
    0;

  const commitCount =
    analysis?.commitCount ??
    repository.commits ??
    0;

  const skillCount =
    analysis?.skillCount ??
    analysis?.skills.length ??
    0;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="gh-panel gh-details-panel gh-reveal gh-delay-3">

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="gh-details-head">

        <div className="gh-details-title">

          <span className="gh-detail-mark">
            <SvgIcon
              name="repo"
              size={22}
            />
          </span>

          <div>

            <div className="gh-repo-title-line">

              <h2>
                {repository.name}
              </h2>

              <span className="gh-public-badge">
                {repository.visibility}
              </span>

              {repository.status ===
                'Analyzed' && (
                <span className="gh-analysis-status done">
                  Analyzed
                </span>
              )}

            </div>

            <p>
              {repository.description}
            </p>

          </div>

        </div>

        <a
          className="gh-github-link"
          href={
            repository.githubUrl
          }
          target="_blank"
          rel="noreferrer"
        >
          <SvgIcon
            name="github"
            size={17}
          />

          View on GitHub

          <SvgIcon
            name="external"
            size={15}
          />
        </a>

      </div>

      {/* ===================================================
          TECHNOLOGIES
          =================================================== */}

      <div className="gh-tech-row">

        {analysis &&
        analysis.technologies.length >
          0 ? (
          analysis.technologies
            .slice(0, 10)
            .map(
              (
                technology,
                index,
              ) => (
                <span
                  key={
                    technology.normalizedName ||
                    technology.name
                  }
                >
                  <i
                    className={`tech-dot t-${
                      index % 5
                    }`}
                  />

                  {technology.name}
                </span>
              ),
            )
        ) : repository.topics.length >
          0 ? (
          repository.topics.map(
            (topic, index) => (
              <span key={topic}>
                <i
                  className={`tech-dot t-${
                    index % 5
                  }`}
                />

                {topic}
              </span>
            ),
          )
        ) : (
          <span>
            <i className="tech-dot t-0" />
            {repository.language}
          </span>
        )}

      </div>

      {/* ===================================================
          TABS
          =================================================== */}

      <div className="gh-tabs">

        {tabs.map(
          (item) => (
            <button
              key={item}
              type="button"
              className={
                tab === item
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setTab(item)
              }
            >
              {item}
            </button>
          ),
        )}

      </div>

      {/* ===================================================
          TAB CONTENT
          =================================================== */}

      <div className="gh-tab-content">

        {loadingAnalysis && (
          <div className="gh-simple-tab">
            <span>
              <SvgIcon
                name="refresh"
                size={23}
              />
            </span>

            <div>
              <strong>
                Loading analysis data
              </strong>

              <p>
                Fetching the persisted
                repository analysis,
                skills, proficiency,
                files and commits.
              </p>
            </div>
          </div>
        )}

        {!loadingAnalysis &&
          analysisError && (
            <div className="gh-simple-tab">
              <span>
                <SvgIcon
                  name="x"
                  size={23}
                />
              </span>

              <div>
                <strong>
                  Analysis data could not
                  be loaded
                </strong>

                <p>
                  {analysisError}
                </p>
              </div>
            </div>
          )}

        {!loadingAnalysis &&
          !analysisError &&
          tab === 'Overview' && (
            <Overview
              repo={repository}
              analysis={analysis}
            />
          )}

        {!loadingAnalysis &&
          !analysisError &&
          tab === 'Languages' && (
            <Languages
              languages={
                languageEntries
              }
            />
          )}

        {!loadingAnalysis &&
          !analysisError &&
          tab === 'Files' && (
            <FilesTab
              analysis={analysis}
              fallbackCount={
                fileCount
              }
            />
          )}

        {!loadingAnalysis &&
          !analysisError &&
          tab === 'Commits' && (
            <CommitsTab
              analysis={analysis}
              fallbackCount={
                commitCount
              }
            />
          )}

        {!loadingAnalysis &&
          !analysisError &&
          tab === 'Analysis' && (
            <AnalysisTab
              analysis={analysis}
              fallbackSkillCount={
                skillCount
              }
            />
          )}

      </div>

      {/* ===================================================
          DESCRIPTION
          =================================================== */}

      <div className="gh-description gh-repository-description">

        <div className="gh-description-heading">
          <h3>
            Description
          </h3>

          <span className="gh-description-source">
            GitHub repository
          </span>
        </div>

        <p>
          {repository.description ||
            'No description provided on GitHub.'}
        </p>

      </div>

      {/* ===================================================
          ACTIONS
          =================================================== */}

      <div className="gh-actions">

        <button
          type="button"
          className="gh-primary-action"
          onClick={() =>
            onAnalyze(
              repository.id,
            )
          }
          disabled={analyzing}
        >
          <SvgIcon
            name={
              analyzing
                ? 'loader'
                : 'playCircle'
            }
            size={20}
          />

          {analyzing
            ? 'Analyzing Repository…'
            : repository.status ===
                'Analyzed'
              ? 'Analyze Again'
              : 'Analyze Repository'}
        </button>

        <button
          type="button"
          className="gh-secondary-action"
          onClick={async () => {
            try {
              const result =
                analysis ??
                await getLatestRepositoryAnalysis(
                  repository.id,
                );

              navigate(
                `/analysis/${encodeURIComponent(
                  result.analysisRun.id,
                )}`,
              );
            } catch {
              // Keep the user on the repository card when no completed
              // analysis is available yet.
              setTab('Analysis');
            }
          }}
        >
          <SvgIcon
            name="external"
            size={18}
          />

          View Details

          <SvgIcon
            name="external"
            size={15}
          />
        </button>

      </div>

    </section>
  );
}

/* =========================================================
   OVERVIEW
   ========================================================= */

function Overview({
  repo,
  analysis,
}: {
  repo: Repository;
  analysis: RepositoryAnalysisResult | null;
}) {
  const skillCount =
    analysis?.skills.length ?? 0;

  const technologyCount =
    analysis?.technologies.length ??
    0;

  const fileCount =
    analysis?.fileCount ??
    repo.files ??
    0;

  const commitCount =
    analysis?.commitCount ??
    repo.commits ??
    0;

  return (
    <div className="gh-overview-modern">

      <div className="gh-overview-stat-grid">

        <Stat
          icon="star"
          value={repo.stars}
          label="Stars"
        />

        <Stat
          icon="gitbranch"
          value={repo.forks}
          label="Forks"
        />

        <Stat
          icon="file"
          value={fileCount}
          label="Files analyzed"
        />

        <Stat
          icon="sparkle"
          value={skillCount}
          label="Skills detected"
        />

      </div>

      <div className="gh-overview-card">

        <div className="gh-overview-card-heading">
          <div>
            <h3>
              Analysis summary
            </h3>

            <span className="gh-overview-muted">
              Persisted analysis results
            </span>
          </div>
        </div>

        <div className="gh-stat-strip">

          <div className="gh-detail-stat">
            <span>
              <SvgIcon
                name="code"
                size={19}
              />
            </span>

            <div>
              <strong>
                {technologyCount}
              </strong>

              <small>
                Technologies
              </small>
            </div>
          </div>

          <div className="gh-detail-stat">
            <span>
              <SvgIcon
                name="sparkle"
                size={19}
              />
            </span>

            <div>
              <strong>
                {skillCount}
              </strong>

              <small>
                Skills
              </small>
            </div>
          </div>

          <div className="gh-detail-stat">
            <span>
              <SvgIcon
                name="file"
                size={19}
              />
            </span>

            <div>
              <strong>
                {fileCount}
              </strong>

              <small>
                Files
              </small>
            </div>
          </div>

          <div className="gh-detail-stat">
            <span>
              <SvgIcon
                name="gitcommit"
                size={19}
              />
            </span>

            <div>
              <strong>
                {commitCount}
              </strong>

              <small>
                Commits
              </small>
            </div>
          </div>

        </div>

      </div>

      {analysis?.skills.length ? (
        <div className="gh-overview-card">

          <div className="gh-overview-card-heading">
            <h3>
              Detected skills
            </h3>

            <span className="gh-overview-muted">
              {skillCount} detected
            </span>
          </div>

          <div className="gh-skill-cloud">

            {analysis.skills
              .slice(0, 12)
              .map((skill) => (
                <span
                  key={
                    skill.normalizedName ||
                    skill.name
                  }
                  className="gh-skill-chip"
                >
                  <span>
                    ✦
                  </span>

                  <strong>
                    {skill.name}
                  </strong>

                  <small>
                    {Math.round(
                      skill.confidence *
                        100,
                    )}
                    %
                  </small>
                </span>
              ))}

          </div>

        </div>
      ) : null}

    </div>
  );
}

/* =========================================================
   LANGUAGE TAB
   ========================================================= */

function Languages({
  languages,
}: {
  languages: [string, number][];
}) {
  const total =
    languages.reduce(
      (sum, [, percentage]) =>
        sum + percentage,
      0,
    );

  const normalized =
    total > 0
      ? languages
      : [];

  return (
    <div className="gh-rich-tab">

      <div className="gh-rich-tab-header">

        <div>
          <h3>
            Language composition
          </h3>

          <p>
            Languages detected from the
            analyzed repository snapshot.
          </p>
        </div>

        <div className="gh-language-total">
          <strong>
            {languages.length}
          </strong>

          <small>
            languages
          </small>
        </div>

      </div>

      {normalized.length ? (
        <>
          <div className="gh-language-bar gh-language-large-bar">
            {normalized.map(
              (
                [name, percentage],
                index,
              ) => (
                <span
                  key={name}
                  className={`bar-${
                    index % 5
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      percentage,
                    )}%`,
                  }}
                />
              ),
            )}
          </div>

          <div className="gh-language-rich-list">

            {normalized.map(
              (
                [name, percentage],
                index,
              ) => (
                <div
                  className="gh-language-rich-item"
                  key={name}
                >
                  <div className="gh-language-rich-top">

                    <span>
                      <i
                        className={`lang-dot ${
                          [
                            'blue',
                            'cyan',
                            'purple',
                            'yellow',
                            'green',
                          ][
                            index % 5
                          ]
                        }`}
                      />

                      {name}
                    </span>

                    <strong>
                      {percentage.toFixed(
                        1,
                      )}
                      %
                    </strong>

                  </div>

                  <small>
                    Source: GitHub language
                    analysis
                  </small>
                </div>
              ),
            )}

          </div>
        </>
      ) : (
        <div className="gh-analysis-empty">
          <span className="gh-empty-icon">
            ◉
          </span>

          <strong>
            No language data
          </strong>

          <p>
            Language analysis data is
            not available for this
            repository snapshot yet.
          </p>
        </div>
      )}

    </div>
  );
}

/* =========================================================
   FILES
   ========================================================= */

function FilesTab({
  analysis,
  fallbackCount,
}: {
  analysis: RepositoryAnalysisResult | null;
  fallbackCount: number;
}) {
  if (
    !analysis ||
    !analysis.files.length
  ) {
    return (
      <div className="gh-simple-tab">

        <span>
          <SvgIcon
            name="file"
            size={23}
          />
        </span>

        <div>

          <strong>
            {fallbackCount || 'No'} files
            indexed
          </strong>

          <p>
            {analysis
              ? 'The completed analysis did not return a file listing.'
              : 'Run a repository analysis to populate the analyzed file tree.'}
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="gh-rich-tab">

      <div className="gh-rich-tab-header">

        <div>
          <h3>
            Analyzed files
          </h3>

          <p>
            Files captured from the
            analyzed repository snapshot.
          </p>
        </div>

        <span className="gh-count-pill">
          {analysis.fileCount} files
        </span>

      </div>

      <div className="gh-files-list">

        {analysis.files.map(
          (file) => (
            <div
              className="gh-file-row"
              key={
                `${file.path}-${file.sha}`
              }
            >

              <span className="gh-file-icon">
                <SvgIcon
                  name={
                    file.type ===
                    'tree'
                      ? 'folder'
                      : 'file'
                  }
                  size={16}
                />
              </span>

              <div className="gh-file-path">

                <strong>
                  {file.path}
                </strong>

                <small>
                  {file.type ===
                  'tree'
                    ? 'Directory'
                    : 'File'}
                </small>

              </div>

              {file.extension && (
                <span className="gh-file-extension">
                  {file.extension}
                </span>
              )}

              {file.size > 0 && (
                <span className="gh-file-size">
                  {formatBytes(
                    file.size,
                  )}
                </span>
              )}

            </div>
          ),
        )}

      </div>

    </div>
  );
}

/* =========================================================
   COMMITS
   ========================================================= */

function CommitsTab({
  analysis,
  fallbackCount,
}: {
  analysis: RepositoryAnalysisResult | null;
  fallbackCount: number;
}) {
  if (
    !analysis ||
    !analysis.commits.length
  ) {
    return (
      <div className="gh-simple-tab">

        <span>
          <SvgIcon
            name="gitcommit"
            size={23}
          />
        </span>

        <div>

          <strong>
            {fallbackCount || 'No'} commits
          </strong>

          <p>
            {analysis
              ? 'The completed analysis did not return commit history.'
              : 'Analyze the repository to populate commit history.'}
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="gh-rich-tab">

      <div className="gh-rich-tab-header">

        <div>
          <h3>
            Commit history
          </h3>

          <p>
            Recent commits associated with
            this analyzed repository snapshot.
          </p>
        </div>

        <span className="gh-count-pill">
          {analysis.commitCount} commits
        </span>

      </div>

      <div className="gh-commit-list">

        {analysis.commits.map(
          (
            commit,
            index,
          ) => (
            <div
              className="gh-commit-row"
              key={
                commit.sha ||
                `commit-${index}`
              }
            >

              <div className="gh-commit-timeline">

                <span className="gh-commit-dot">
                  <SvgIcon
                    name="gitcommit"
                    size={12}
                  />
                </span>

                {index <
                  analysis.commits
                    .length -
                    1 && (
                  <i />
                )}

              </div>

              <div className="gh-commit-content">

                <div className="gh-commit-top">

                  <strong>
                    {commit.message ||
                      'Commit'}
                  </strong>

                  {commit.htmlUrl && (
                    <a
                      href={
                        commit.htmlUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open commit on GitHub"
                    >
                      <SvgIcon
                        name="external"
                        size={13}
                      />
                    </a>
                  )}

                </div>

                <div className="gh-commit-meta">

                  <code>
                    {commit.shortSha}
                  </code>

                  <span>
                    {commit.authorName}
                  </span>

                  <span>
                    {formatDate(
                      commit.authorDate,
                    )}
                  </span>

                </div>

              </div>

            </div>
          ),
        )}

      </div>

    </div>
  );
}

/* =========================================================
   ANALYSIS TAB
   ========================================================= */

function AnalysisTab({
  analysis,
  fallbackSkillCount,
}: {
  analysis: RepositoryAnalysisResult | null;
  fallbackSkillCount: number;
}) {
  if (!analysis) {
    return (
      <div className="gh-simple-tab">

        <span>
          <SvgIcon
            name="sparkle"
            size={23}
          />
        </span>

        <div>

          <strong>
            Analysis not loaded
          </strong>

          <p>
            Run repository analysis to
            calculate skills and
            proficiency.
          </p>

        </div>

      </div>
    );
  }

  if (
    !analysis.skills.length &&
    !analysis.proficiencies.length &&
    !analysis.technologies.length
  ) {
    return (
      <div className="gh-analysis-empty">

        <span className="gh-empty-icon">
          ✦
        </span>

        <strong>
          Analysis completed
        </strong>

        <p>
          The analysis run completed,
          but no technology, skill, or
          proficiency records were
          returned for this snapshot.
        </p>

      </div>
    );
  }

  return (
    <div className="gh-analysis-page">

      {/* HERO */}

      <div className="gh-analysis-hero">

        <div className="gh-analysis-hero-left">

          <div className="gh-analysis-orb">
            ✦
          </div>

          <div>

            <span className="gh-eyebrow">
              REPOSITORY ANALYSIS
            </span>

            <h2>
              Your code intelligence
            </h2>

            <p>
              Technologies, skills and
              proficiency signals extracted
              from this repository.
            </p>

          </div>

        </div>

        <div className="gh-analysis-complete">

          <span className="gh-status-dot" />

          <div>

            <strong>
              COMPLETED
            </strong>

            <small>
              {formatDate(
                analysis.analysisRun
                  .completedAt,
              )}
            </small>

          </div>

        </div>

      </div>

      {/* METRICS */}

      <div className="gh-analysis-metrics">

        <Metric
          icon="code"
          value={
            analysis.technologies.length
          }
          label="Technologies"
          tone="blue"
        />

        <Metric
          icon="sparkle"
          value={
            analysis.skills.length ||
            fallbackSkillCount
          }
          label="Skills"
          tone="purple"
        />

        <Metric
          icon="chart"
          value={
            analysis.proficiencies.length
          }
          label="Proficiency scores"
          tone="cyan"
        />

        <Metric
          icon="file"
          value={
            analysis.fileCount
          }
          label="Files analyzed"
          tone="orange"
        />

      </div>

      {/* MAIN ANALYSIS */}

      <div className="gh-analysis-grid">

        {/* PROFICIENCY */}

        <div className="gh-analysis-card">

          <div className="gh-analysis-card-header">

            <div>

              <h3>
                Proficiency
              </h3>

              <p>
                Scores generated from the
                skills extracted from this
                repository.
              </p>

            </div>

            <span className="gh-count-pill">
              {
                analysis.proficiencies
                  .length
              }{' '}
              assessments
            </span>

          </div>

          {analysis.proficiencies.length ? (
            <div className="gh-proficiency-list">

              {analysis.proficiencies.map(
                (item) => (
                  <div
                    className="gh-proficiency-item"
                    key={
                      item.skillName
                    }
                  >

                    <div className="gh-proficiency-top">

                      <div>

                        <strong>
                          {
                            item.skillName
                          }
                        </strong>

                        <span className="gh-proficiency-level">
                          {item.level}
                        </span>

                      </div>

                      <strong className="gh-proficiency-score">
                        {Math.round(
                          item.score,
                        )}
                        <small>
                          /100
                        </small>
                      </strong>

                    </div>

                    <div className="gh-progress-track">

                      <div
                        className="gh-progress-fill"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              item.score,
                            ),
                          )}%`,
                        }}
                      />

                    </div>

                    <div className="gh-proficiency-meta">

                      <span>
                        Confidence:{' '}
                        {Math.round(
                          item.confidence *
                            100,
                        )}
                        %
                      </span>

                      {item.methodologyVersion && (
                        <span>
                          {
                            item.methodologyVersion
                          }
                        </span>
                      )}

                    </div>

                  </div>
                ),
              )}

            </div>
          ) : (
            <div className="gh-analysis-empty">
              <strong>
                No proficiency scores
              </strong>

              <p>
                The analysis completed
                without returning
                proficiency assessments.
              </p>
            </div>
          )}

        </div>

        {/* TECHNOLOGIES + SKILLS */}

        <div className="gh-analysis-card">

          <div className="gh-analysis-card-header">

            <div>

              <h3>
                Detected stack
              </h3>

              <p>
                Technologies and canonical
                skills identified in the
                repository.
              </p>

            </div>

          </div>

          <span className="gh-section-kicker">
            TECHNOLOGIES
          </span>

          <div className="gh-tech-cloud">

            {analysis.technologies.map(
              (
                technology,
                index,
              ) => (
                <span
                  className="gh-analysis-tech"
                  key={
                    technology.normalizedName ||
                    technology.name
                  }
                >

                  <i className="gh-tech-dot" />

                  <span>
                    {technology.name}
                  </span>

                  <small>
                    {Math.round(
                      technology.confidence *
                        100,
                    )}
                    %
                  </small>

                </span>
              ),
            )}

          </div>

          <span
            className="gh-section-kicker"
            style={{
              marginTop: 20,
            }}
          >
            SKILLS
          </span>

          <div className="gh-skill-cloud">

            {analysis.skills.map(
              (skill) => (
                <span
                  className="gh-skill-chip"
                  key={
                    skill.normalizedName ||
                    skill.name
                  }
                >
                  <span>
                    ✦
                  </span>

                  <strong>
                    {skill.name}
                  </strong>

                  <small>
                    {Math.round(
                      skill.confidence *
                        100,
                    )}
                    %
                  </small>
                </span>
              ),
            )}

          </div>

        </div>

      </div>

      {/* SNAPSHOT */}

      {analysis.snapshot && (
        <div className="gh-analysis-card gh-snapshot-card">

          <div className="gh-analysis-card-header">

            <div>

              <h3>
                Repository snapshot
              </h3>

              <p>
                The exact repository
                revision used for this
                analysis.
              </p>

            </div>

            <span className="gh-count-pill">
              Snapshot
            </span>

          </div>

          <div className="gh-snapshot-value">
            <code>
              {analysis.snapshot.commitSha ||
                'Commit SHA unavailable'}
            </code>
          </div>

          <div className="gh-snapshot-meta">

            <div>
              <span>
                Captured
              </span>

              <strong>
                {formatDate(
                  analysis.snapshot
                    .capturedAt,
                )}
              </strong>
            </div>

            <div>
              <span>
                Files
              </span>

              <strong>
                {analysis.fileCount}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <strong className="gh-snapshot-status">
                Completed
              </strong>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   STAT
   ========================================================= */

function Stat({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string | number;
  label: string;
}) {
  return (
    <div className="gh-overview-stat">

      <span className="gh-overview-stat-icon">
        <SvgIcon
          name={icon}
          size={18}
        />
      </span>

      <div>

        <strong>
          {value}
        </strong>

        <small>
          {label}
        </small>

      </div>

    </div>
  );
}

/* =========================================================
   ANALYSIS METRIC
   ========================================================= */

function Metric({
  icon,
  value,
  label,
  tone,
}: {
  icon: string;
  value: number;
  label: string;
  tone:
    | 'blue'
    | 'purple'
    | 'cyan'
    | 'orange';
}) {
  return (
    <div className="gh-analysis-metric">

      <span
        className={`gh-analysis-metric-icon ${tone}`}
      >
        <SvgIcon
          name={icon}
          size={19}
        />
      </span>

      <div>

        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   UTILITIES
   ========================================================= */

function formatBytes(
  bytes: number,
): string {
  if (!bytes) {
    return '0 B';
  }

  const units = [
    'B',
    'KB',
    'MB',
    'GB',
  ];

  const exponent = Math.min(
    Math.floor(
      Math.log(bytes) /
        Math.log(1024),
    ),
    units.length - 1,
  );

  const value =
    bytes /
    Math.pow(
      1024,
      exponent,
    );

  return `${value.toFixed(
    exponent === 0
      ? 0
      : 1,
  )} ${units[exponent]}`;
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    !Number.isFinite(
      date.getTime(),
    )
  ) {
    return '—';
  }

  return date.toLocaleString();
}