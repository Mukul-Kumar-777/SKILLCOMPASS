import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { SvgIcon } from "../../components/icons/SvgIcon";

import {
  getAnalysisResult,
  getRepositoryAnalysisRuns,
} from "../../api/analysis";

import { syncGithubRepositories } from "../../api/github";

import type { Repository } from "../../types/github";

import type { RepositoryAnalysisResult } from "../../api/analysis";

import { navigate } from "../../router/appRouter";

import "./skills.css";

/* =========================================================
   TYPES
   ========================================================= */

type SkillFilter =
  | "All"
  | "Programming"
  | "Web"
  | "Frameworks"
  | "Tools"
  | "Other";

interface AggregatedSkill {
  name: string;
  normalizedName: string;
  category: string;
  score: number;
  confidence: number;
  repositories: number;
  evidenceCount: number;
  level: string;
  samplePath: string;
  sampleRepository: string;
}

interface AggregatedTechnology {
  name: string;
  normalizedName: string;
  confidence: number;
  repositories: number;
}

interface EvidenceRow {
  skill: string;
  normalizedName: string;
  repositories: number;
  evidenceCount: number;
  confidence: number;
  example: string;
  repository: string;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function Skills() {
  const [repositories, setRepositories] = useState<Repository[]>([]);

  const [analysisResults, setAnalysisResults] = useState<
    RepositoryAnalysisResult[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [activeFilter, setActiveFilter] = useState<SkillFilter>("All");

  /* =======================================================
     LOAD
     ======================================================= */

  const loadSkills = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    setError("");

    try {
      const syncResult = await syncGithubRepositories();

      const repoList = syncResult.repositories;

      setRepositories(repoList);

      /*
       * Every repository may have multiple analysis runs.
       * We only use its latest completed run.
       */
      const results = await Promise.allSettled(
        repoList.map(async (repository) => {
          const runs = await getRepositoryAnalysisRuns(repository.id);

          const completed = runs
            .filter((run) => run.status === "COMPLETED")
            .sort((a, b) => {
              const aTime = new Date(
                a.completedAt ?? a.startedAt ?? 0,
              ).getTime();

              const bTime = new Date(
                b.completedAt ?? b.startedAt ?? 0,
              ).getTime();

              return bTime - aTime;
            });

          const latest = completed[0];

          if (!latest) {
            return null;
          }

          return getAnalysisResult(latest.id);
        }),
      );

      const successful = results
        .filter(
          (
            result,
          ): result is PromiseFulfilledResult<RepositoryAnalysisResult> =>
            result.status === "fulfilled" && result.value !== null,
        )
        .map((result) => result.value);

      setAnalysisResults(successful);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your skill profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    void loadSkills();
  }, []);

  /* =======================================================
     REFRESH
     ======================================================= */

  const refresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {
      await loadSkills(false);
    } finally {
      setRefreshing(false);
    }
  };

  /* =======================================================
     AGGREGATE SKILLS
     ======================================================= */

  const skills = useMemo(() => {
    const map = new Map<string, AggregatedSkill>();

    for (const result of analysisResults) {
      const repositoryName = result.repository.name;

      for (const skill of result.skills) {
        const key = skill.normalizedName || skill.name.trim().toLowerCase();

        const existing = map.get(key);

        /*
         * Find a representative
         * proficiency score.
         */
        const proficiency = result.proficiencies.find(
          (item) =>
            item.skillName.trim().toLowerCase() ===
            skill.name.trim().toLowerCase(),
        );

        const score = proficiency?.score ?? 0;

        const evidence = skill.evidence ?? [];

        if (!existing) {
          map.set(key, {
            name: skill.name,
            normalizedName: key,
            category: skill.category ?? "OTHER",
            score,
            confidence: skill.confidence,
            repositories: 1,
            evidenceCount: skill.evidenceCount || evidence.length,
            level: proficiency?.level ?? getLevelFromScore(score),
            samplePath: evidence[0]?.path ?? "Repository analysis",
            sampleRepository:
              evidence[0]?.path ??
              result.repository?.name ??
              "Unknown Repository",
          });

          continue;
        }

        /*
         * Keep strongest score.
         */
        if (score > existing.score) {
          existing.score = score;

          existing.level = proficiency?.level ?? getLevelFromScore(score);

          existing.samplePath = evidence[0]?.path ?? existing.samplePath;

          existing.sampleRepository =
            evidence[0]?.path ??
            result.repository?.name ??
            "Unknown Repository";
        }

        existing.confidence = Math.max(existing.confidence, skill.confidence);

        existing.repositories += 1;

        existing.evidenceCount += skill.evidenceCount || evidence.length;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }, [analysisResults]);

  /* =======================================================
     AGGREGATE TECHNOLOGIES
     ======================================================= */

  const technologies = useMemo(() => {
    const map = new Map<string, AggregatedTechnology>();

    for (const result of analysisResults) {
      const seenInRepository = new Set<string>();

      for (const technology of result.technologies) {
        const key =
          technology.normalizedName || technology.name.trim().toLowerCase();

        if (seenInRepository.has(key)) {
          continue;
        }

        seenInRepository.add(key);

        const existing = map.get(key);

        if (!existing) {
          map.set(key, {
            name: technology.name,
            normalizedName: key,
            confidence: technology.confidence,
            repositories: 1,
          });
        } else {
          existing.confidence = Math.max(
            existing.confidence,
            technology.confidence,
          );

          existing.repositories += 1;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.confidence - a.confidence);
  }, [analysisResults]);

  /* =======================================================
     FILTER SKILLS
     ======================================================= */

  const filteredSkills = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return skills.filter((skill) => {
      const matchesSearch =
        !normalizedSearch ||
        skill.name.toLowerCase().includes(normalizedSearch) ||
        skill.category.toLowerCase().includes(normalizedSearch);

      const matchesFilter = matchesSkillFilter(skill, activeFilter);

      return matchesSearch && matchesFilter;
    });
  }, [skills, search, activeFilter]);

  /* =======================================================
     TOP SKILLS
     ======================================================= */

  const topSkills = skills.slice(0, 6);

  /* =======================================================
     METRICS
     ======================================================= */

  const averageProficiency = skills.length
    ? Math.round(
        skills.reduce((total, skill) => total + skill.score, 0) / skills.length,
      )
    : 0;

  const analyzedRepositories = analysisResults.length;

  const skillDistribution = useMemo(() => {
    const distribution = {
      Expert: 0,
      Advanced: 0,
      Intermediate: 0,
      Beginner: 0,
    };

    for (const skill of skills) {
      const level = normalizeLevel(skill.level, skill.score);

      distribution[level] += 1;
    }

    return distribution;
  }, [skills]);

  /* =======================================================
     EVIDENCE
     ======================================================= */

  const evidenceRows = useMemo(() => {
    return skills.slice(0, 15).map(
      (skill): EvidenceRow => ({
        skill: skill.name,
        normalizedName: skill.normalizedName,
        repositories: skill.repositories,
        evidenceCount: skill.evidenceCount,
        confidence: skill.confidence,
        example: skill.samplePath,
        repository: skill.sampleRepository,
      }),
    );
  }, [skills]);

  /* =======================================================
     CATEGORY COUNTS
     ======================================================= */

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const skill of skills) {
      const category = normalizeCategory(skill.category);

      counts.set(category, (counts.get(category) ?? 0) + 1);
    }

    return counts;
  }, [skills]);

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main
      className="main-area skills-page"
      style={
        {
          "--skills-bg": "var(--sc-bg)",
          "--skills-panel": "var(--sc-card)",
          "--skills-panel-soft": "var(--sc-card-soft)",
          "--skills-line": "var(--sc-line)",
          "--skills-text": "var(--sc-text)",
          "--skills-muted": "var(--sc-copy)",
          "--skills-dim": "var(--sc-dim)",
          "--skills-blue": "var(--sc-blue)",
          "--skills-cyan": "var(--sc-cyan)",
          "--skills-purple": "var(--sc-purple)",
          "--skills-mint": "var(--sc-mint)",
        } as CSSProperties
      }
    >
      {/* =================================================
          HEADER
          ================================================= */}

      <header className="skills-header">
        <div className="skills-heading">
          <span className="skills-eyebrow">SKILLCOMPASS</span>

          <h1>Skills</h1>

          <p>
            A complete view of your technical skills, proficiency, and growth
            opportunities.
          </p>
        </div>

        <div className="skills-header-actions">
          <label className="skills-search">
            <SvgIcon name="search" size={20} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search skills..."
            />
          </label>

          <button
            type="button"
            className="skills-refresh-button"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            <SvgIcon name="refresh" size={17} />

            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <section className="skills-error">
          <SvgIcon name="x" size={20} />

          <div>
            <strong>Unable to load skill data</strong>

            <p>{error}</p>
          </div>
        </section>
      )}

      {/* =================================================
          LOADING
          ================================================= */}

      {loading ? (
        <SkillsLoading />
      ) : (
        <>
          {/* =============================================
              METRICS
              ============================================= */}

          <section className="skills-metrics">
            <MetricCard
              tone="blue"
              icon="layers"
              value={skills.length}
              label="Detected skills"
              detail={
                analyzedRepositories
                  ? `${analyzedRepositories} analyzed repositories`
                  : "Analyze a repository to begin"
              }
            />

            <MetricCard
              tone="cyan"
              icon="code"
              value={technologies.length}
              label="Core technologies"
              detail={
                technologies.length
                  ? "Unique technologies detected"
                  : "No technology evidence yet"
              }
            />

            <MetricCard
              tone="purple"
              icon="chart"
              value={`${averageProficiency}/100`}
              label="Average proficiency"
              detail={
                skills.length
                  ? "Across detected skills"
                  : "No proficiency scores yet"
              }
            />

            <MetricCard
              tone="mint"
              icon="target"
              value="—"
              label="Skill gaps"
              detail="Select a target role to compare"
            />
          </section>

          {/* =============================================
              DISTRIBUTION + TOP SKILLS
              ============================================= */}

          <section className="skills-main-grid">
            {/* -------------------------------------------
                DISTRIBUTION
                ------------------------------------------- */}

            <article className="skills-card skills-distribution-card">
              <CardHeader
                title="Skill proficiency distribution"
                description="Your skills grouped by current proficiency level."
              />

              {skills.length ? (
                <div className="skills-distribution">
                  <div
                    className="skills-donut"
                    style={{
                      background: createDonutGradient(skillDistribution),
                    }}
                  >
                    <div className="skills-donut-inner">
                      <strong>{skills.length}</strong>

                      <span>Skills</span>
                    </div>
                  </div>

                  <div className="skills-distribution-list">
                    <DistributionRow
                      tone="expert"
                      label="Expert"
                      range="90–100"
                      value={skillDistribution.Expert}
                    />

                    <DistributionRow
                      tone="advanced"
                      label="Advanced"
                      range="70–89"
                      value={skillDistribution.Advanced}
                    />

                    <DistributionRow
                      tone="intermediate"
                      label="Intermediate"
                      range="40–69"
                      value={skillDistribution.Intermediate}
                    />

                    <DistributionRow
                      tone="beginner"
                      label="Beginner"
                      range="0–39"
                      value={skillDistribution.Beginner}
                    />
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon="chart"
                  title="No proficiency data yet"
                  description="Analyze at least one repository to populate your skill profile."
                />
              )}
            </article>

            {/* -------------------------------------------
                TOP SKILLS
                ------------------------------------------- */}

            <article className="skills-card skills-top-card">
              <CardHeader
                title="Top skills"
                description="Your strongest technical skills based on repository analysis."
                action={skills.length ? "View all" : undefined}
                onAction={() => {
                  document.getElementById("skill-stack")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              />

              {topSkills.length ? (
                <div className="skills-top-list">
                  {topSkills.map((skill, index) => (
                    <TopSkillRow
                      key={skill.normalizedName}
                      skill={skill}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="layers"
                  title="No skills detected"
                  description="Your strongest skills will appear here after repository analysis."
                />
              )}
            </article>
          </section>

          {/* =============================================
              SKILL STACK
              ============================================= */}

          <section className="skills-card skills-stack-card" id="skill-stack">
            <CardHeader
              title="Skill stack"
              description="All detected skills derived from your repository evidence."
            />

            <div className="skills-filter-row">
              {(
                [
                  "All",
                  "Programming",
                  "Web",
                  "Frameworks",
                  "Tools",
                  "Other",
                ] as SkillFilter[]
              ).map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={activeFilter === filter ? "active" : ""}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}

                  <span>
                    {filter === "All"
                      ? skills.length
                      : filter === "Programming"
                        ? (categoryCounts.get("Programming") ?? 0)
                        : filter === "Web"
                          ? (categoryCounts.get("Web") ?? 0)
                          : filter === "Frameworks"
                            ? (categoryCounts.get("Frameworks") ?? 0)
                            : filter === "Tools"
                              ? (categoryCounts.get("Tools") ?? 0)
                              : (categoryCounts.get("Other") ?? 0)}
                  </span>
                </button>
              ))}
            </div>

            <div className="skills-stack-grid">
              {filteredSkills.length ? (
                filteredSkills.map((skill, index) => (
                  <SkillStackItem
                    key={skill.normalizedName}
                    skill={skill}
                    index={index}
                  />
                ))
              ) : (
                <div className="skills-no-results">
                  <SvgIcon name="search" size={28} />

                  <strong>No matching skills</strong>

                  <span>Try another search or category.</span>
                </div>
              )}
            </div>
          </section>

          {/* =============================================
              GROWTH SIGNALS + TECHNOLOGIES
              ============================================= */}

          <section className="skills-secondary-grid">
            <article className="skills-card skills-growth-card">
              <CardHeader
                title="Growth signals"
                description="Useful next areas become available when you compare your profile with a target opportunity."
              />

              <div className="skills-growth-empty">
                <div className="skills-growth-icon">
                  <SvgIcon name="target" size={26} />
                </div>

                <div>
                  <strong>Target-role comparison</strong>

                  <p>
                    Skill gaps should be calculated against a specific job or
                    career target. Your current repository profile is ready for
                    that comparison.
                  </p>

                  <button type="button" onClick={() => navigate("/jobs")}>
                    Explore job matches
                    <SvgIcon name="arrow" size={15} />
                  </button>
                </div>
              </div>
            </article>

            <article className="skills-card skills-tech-card">
              <CardHeader
                title="Detected technology stack"
                description="Technologies surfaced across the analyzed repositories."
              />

              {technologies.length ? (
                <div className="skills-tech-cloud">
                  {technologies.slice(0, 18).map((technology, index) => (
                    <span
                      key={technology.normalizedName}
                      className={`skills-tech-pill tone-${index % 5}`}
                    >
                      <i />

                      <strong>{technology.name}</strong>

                      <small>{Math.round(technology.confidence * 100)}%</small>
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="code"
                  title="No technology evidence"
                  description="Technology signals appear here after repository analysis."
                />
              )}
            </article>
          </section>

          {/* =============================================
              REPOSITORY EVIDENCE
              ============================================= */}

          <section className="skills-card skills-evidence-card">
            <CardHeader
              title="Repository evidence"
              description="See where each skill appears in your analyzed repositories."
            />

            {evidenceRows.length ? (
              <div className="skills-evidence-table-wrap">
                <table className="skills-evidence-table">
                  <thead>
                    <tr>
                      <th>Skill</th>

                      <th>Repositories</th>

                      <th>Evidence</th>

                      <th>Confidence</th>

                      <th>Example</th>

                      <th>Repository</th>
                    </tr>
                  </thead>

                  <tbody>
                    {evidenceRows.map((row) => (
                      <tr key={row.normalizedName}>
                        <td>
                          <div className="skills-evidence-skill">
                            <span>✦</span>

                            <strong>{row.skill}</strong>
                          </div>
                        </td>

                        <td>{row.repositories}</td>

                        <td>{row.evidenceCount}</td>

                        <td>
                          <div className="skills-confidence">
                            <div className="skills-confidence-track">
                              <span
                                style={{
                                  width: `${row.confidence * 100}%`,
                                }}
                              />
                            </div>

                            <strong>{Math.round(row.confidence * 100)}%</strong>
                          </div>
                        </td>

                        <td>
                          <code>{row.example}</code>
                        </td>

                        <td>
                          <span className="skills-evidence-repository">
                            {row.repository}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon="file"
                title="No repository evidence"
                description="Analyze a repository to create the evidence trail behind your skills."
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}

/* =========================================================
   METRIC CARD
   ========================================================= */

function MetricCard({
  tone,
  icon,
  value,
  label,
  detail,
}: {
  tone: "blue" | "cyan" | "purple" | "mint";

  icon: string;
  value: string | number;
  label: string;
  detail: string;
}) {
  return (
    <article className={`skills-metric-card tone-${tone}`}>
      <div className="skills-metric-icon">
        <SvgIcon name={icon} size={28} />
      </div>

      <div className="skills-metric-copy">
        <strong>{value}</strong>

        <span>{label}</span>

        <small>{detail}</small>
      </div>
    </article>
  );
}

/* =========================================================
   CARD HEADER
   ========================================================= */

function CardHeader({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="skills-card-header">
      <div>
        <h2>{title}</h2>

        <p>{description}</p>
      </div>

      {action && (
        <button type="button" className="skills-card-action" onClick={onAction}>
          {action}

          <SvgIcon name="arrow" size={15} />
        </button>
      )}
    </div>
  );
}

/* =========================================================
   DISTRIBUTION ROW
   ========================================================= */

function DistributionRow({
  tone,
  label,
  range,
  value,
}: {
  tone: "expert" | "advanced" | "intermediate" | "beginner";

  label: string;
  range: string;
  value: number;
}) {
  return (
    <div className="skills-distribution-row">
      <div className="skills-distribution-label">
        <i className={`distribution-dot ${tone}`} />

        <span>
          {label} ({range})
        </span>
      </div>

      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   TOP SKILL
   ========================================================= */

function TopSkillRow({
  skill,
  index,
}: {
  skill: AggregatedSkill;
  index: number;
}) {
  return (
    <div className="skills-top-row">
      <div className={`skills-top-icon tone-${index % 5}`}>
        {getSkillMark(skill.name)}
      </div>

      <div className="skills-top-main">
        <div className="skills-top-name">
          <strong>{skill.name}</strong>

          <small>{skill.repositories} repos</small>
        </div>

        <div className="skills-top-progress">
          <div className="skills-top-track">
            <span
              style={{
                width: `${Math.max(0, Math.min(100, skill.score))}%`,
              }}
            />
          </div>

          <strong>{Math.round(skill.score)}%</strong>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SKILL STACK ITEM
   ========================================================= */

function SkillStackItem({
  skill,
  index,
}: {
  skill: AggregatedSkill;
  index: number;
}) {
  return (
    <div className="skills-stack-item">
      <div className={`skills-stack-icon tone-${index % 5}`}>
        {getSkillMark(skill.name)}
      </div>

      <div className="skills-stack-copy">
        <strong>{skill.name}</strong>

        <div className="skills-stack-meta">
          <span>{getLevelLabel(skill.level, skill.score)}</span>

          <small>{Math.round(skill.score)}%</small>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY
   ========================================================= */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="skills-empty">
      <div className="skills-empty-icon">
        <SvgIcon name={icon} size={25} />
      </div>

      <strong>{title}</strong>

      <p>{description}</p>
    </div>
  );
}

/* =========================================================
   LOADING
   ========================================================= */

function SkillsLoading() {
  return (
    <div className="skills-loading">
      <div className="skills-loading-hero" />

      <div className="skills-loading-metrics">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div className="skills-skeleton-card" key={index} />
        ))}
      </div>

      <div className="skills-loading-grid">
        <div className="skills-skeleton-large" />

        <div className="skills-skeleton-large" />
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function normalizeLevel(
  value: string,
  score: number,
): "Expert" | "Advanced" | "Intermediate" | "Beginner" {
  const normalized = value.trim().toUpperCase();

  if (normalized.includes("EXPERT")) {
    return "Expert";
  }

  if (normalized.includes("ADVANCED")) {
    return "Advanced";
  }

  if (normalized.includes("INTERMEDIATE")) {
    return "Intermediate";
  }

  if (normalized.includes("BEGINNER")) {
    return "Beginner";
  }

  return getLevelFromScore(score) as
    | "Expert"
    | "Advanced"
    | "Intermediate"
    | "Beginner";
}

function getLevelFromScore(score: number): string {
  if (score >= 90) {
    return "EXPERT";
  }

  if (score >= 70) {
    return "ADVANCED";
  }

  if (score >= 40) {
    return "INTERMEDIATE";
  }

  return "BEGINNER";
}

function getLevelLabel(level: string, score: number) {
  return normalizeLevel(level, score);
}

function normalizeCategory(category: string): string {
  const value = category.trim().toUpperCase();

  if (value.includes("PROGRAM")) {
    return "Programming";
  }

  if (value.includes("WEB") || value.includes("FRONTEND")) {
    return "Web";
  }

  if (value.includes("FRAMEWORK")) {
    return "Frameworks";
  }

  if (
    value.includes("TOOL") ||
    value.includes("DEVOPS") ||
    value.includes("CLOUD")
  ) {
    return "Tools";
  }

  return "Other";
}

function matchesSkillFilter(
  skill: AggregatedSkill,
  filter: SkillFilter,
): boolean {
  if (filter === "All") {
    return true;
  }

  return normalizeCategory(skill.category) === filter;
}

function getSkillMark(name: string): string {
  const value = name.toLowerCase();

  if (value.includes("javascript")) {
    return "JS";
  }

  if (value.includes("typescript")) {
    return "TS";
  }

  if (value.includes("python")) {
    return "Py";
  }

  if (value.includes("react")) {
    return "R";
  }

  if (value.includes("java")) {
    return "J";
  }

  if (value.includes("c++")) {
    return "C++";
  }

  if (value.includes("html")) {
    return "H";
  }

  if (value.includes("css")) {
    return "C";
  }

  return "✦";
}

function createDonutGradient(distribution: {
  Expert: number;
  Advanced: number;
  Intermediate: number;
  Beginner: number;
}): string {
  const total =
    distribution.Expert +
    distribution.Advanced +
    distribution.Intermediate +
    distribution.Beginner;

  if (!total) {
    return "#16345f";
  }

  const expert = (distribution.Expert / total) * 100;

  const advanced = expert + (distribution.Advanced / total) * 100;

  const intermediate = advanced + (distribution.Intermediate / total) * 100;

  return `
    conic-gradient(
      #38d6a5 0 ${expert}%,
      #2e8fff ${expert}% ${advanced}%,
      #ffa845 ${advanced}% ${intermediate}%,
      #ed4f9b ${intermediate}% 100%
    )
  `;
}
