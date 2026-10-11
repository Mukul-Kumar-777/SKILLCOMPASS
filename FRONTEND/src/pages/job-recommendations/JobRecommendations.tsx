import { useEffect, useMemo, useState } from "react";
import "./job-recommendations.css";
import { navigate } from "../../router/appRouter";
import { SvgIcon } from "../../components/icons/SvgIcon";
import { getBackendJobProfiles } from "../../api/jobProfiles";
import {
  CURATED_JOB_PROFILES,
  mergeProfiles,
  type CuratedJobProfile,
} from "../../api/jobProfiles.catalog";
import {
  generateJobRecommendations,
  getJobRecommendationDetail,
  getJobRecommendations,
  type JobRecommendationDetail,
  type RecommendedJob,
} from "../../api/jobRecommendations";

interface JobRecommendationsProps {
  jobProfileId?: string;
  jobProfileSlug?: string;
}

type ProfileLoadState = "idle" | "loading" | "ready";

const formatDate = (value: string | null): string => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatLocation = (
  location: string | null,
  remote: boolean,
): string => {
  if (remote && location) return `${location} · Remote`;
  if (remote) return "Remote";
  return location || "Location unavailable";
};

const getScoreTone = (score: number): "high" | "mid" | "low" => {
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
};

const getScoreLabel = (score: number): string => {
  if (score >= 75) return "Strong match";
  if (score >= 50) return "Promising match";
  return "Developing match";
};

const profileTitleFromSlug = (slug: string): string => {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export default function JobRecommendations({
  jobProfileId,
  jobProfileSlug,
}: JobRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedJob[]>([]);
  const [selected, setSelected] = useState<RecommendedJob | null>(null);
  const [detail, setDetail] = useState<JobRecommendationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [search, setSearch] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [focusMode, setFocusMode] = useState(false);

  const [profileCatalog, setProfileCatalog] = useState<CuratedJobProfile[]>(
    CURATED_JOB_PROFILES,
  );
  const [profileSearch, setProfileSearch] = useState("");
  const [profileLoadState, setProfileLoadState] =
    useState<ProfileLoadState>("idle");
  const [profileCatalogNotice, setProfileCatalogNotice] = useState("");

  const hasJobProfile =
    Boolean(jobProfileId?.trim()) || Boolean(jobProfileSlug?.trim());

  const selectedProfileTitle = jobProfileSlug?.trim()
    ? profileTitleFromSlug(jobProfileSlug.trim())
    : "Selected Job Profile";

  const loadRecommendations = async (
    shouldGenerate = false,
  ) => {
    setLoading(true);
    setError("");

    try {
      const result = shouldGenerate
        ? await generateJobRecommendations({
            jobProfileId,
            jobProfileSlug,
          })
        : await getJobRecommendations({
            jobProfileId,
            jobProfileSlug,
          });

      setRecommendations(result.recommendations);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load job recommendations.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadInitialRecommendations = async () => {
    setLoading(true);
    setGenerating(false);
    setError("");

    try {
      const existing = await getJobRecommendations({
        jobProfileId,
        jobProfileSlug,
      });

      if (existing.recommendations.length > 0) {
        setRecommendations(existing.recommendations);
        return;
      }

      setGenerating(true);

      const generated = await generateJobRecommendations({
        jobProfileId,
        jobProfileSlug,
      });

      setRecommendations(generated.recommendations);

      if (generated.recommendations.length === 0) {
        setError(
          generated.jobsEvaluated === 0
            ? `No synchronized openings are classified under ${generated.jobProfile.title} yet. Sync the latest job catalog and try again.`
            : `No recommendation matches were generated from the ${generated.jobProfile.title} openings. Try Recalculate Matches after the job catalog is refreshed.`,
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load job recommendations.",
      );
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    setRecommendations([]);
    setSelected(null);
    setDetail(null);
    setFocusMode(false);
    setError("");
    setDetailError("");

    if (!jobProfileId?.trim() && !jobProfileSlug?.trim()) {
      return;
    }

    void loadInitialRecommendations();
  }, [jobProfileId, jobProfileSlug]);

  useEffect(() => {
    const handleFocusKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingTarget =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      if (event.key.toLowerCase() === "f" && !isTypingTarget && selected && detail) {
        event.preventDefault();
        setFocusMode((current) => !current);
        return;
      }

      if (event.key === "Escape") {
        setFocusMode(false);
      }
    };

    window.addEventListener("keydown", handleFocusKey);
    return () => window.removeEventListener("keydown", handleFocusKey);
  }, [selected, detail]);

  useEffect(() => {
    if (hasJobProfile) {
      return;
    }

    let cancelled = false;

    const loadProfilePickerData = async () => {
      setProfileLoadState("loading");
      setProfileCatalogNotice("");

      let backendResult: PromiseSettledResult<CuratedJobProfile[]>;

      try {
        backendResult = {
          status: "fulfilled",
          value: await getBackendJobProfiles({ limit: 200 }),
        };
      } catch (error) {
        backendResult = {
          status: "rejected",
          reason: error,
        };
      }

      if (cancelled) return;

      if (backendResult.status === "fulfilled") {
        setProfileCatalog(
          mergeProfiles(CURATED_JOB_PROFILES, backendResult.value),
        );
      } else {
        setProfileCatalog(CURATED_JOB_PROFILES);
        setProfileCatalogNotice(
          "Showing the built-in role catalog while the expanded catalog is unavailable.",
        );
      }

      setProfileLoadState("ready");
    };

    void loadProfilePickerData();

    return () => {
      cancelled = true;
    };
  }, [hasJobProfile]);

  const profileSearchResults = useMemo(() => {
    const term = profileSearch.trim().toLowerCase();

    if (!term) {
      return profileCatalog.slice(0, 12);
    }

    return profileCatalog
      .filter((profile) => {
        const searchable = [
          profile.title,
          profile.slug,
          profile.domain,
          ...profile.aliases,
        ];

        return searchable.some((value) =>
          value.toLowerCase().includes(term),
        );
      })
      .slice(0, 20);
  }, [profileCatalog, profileSearch]);

  const filteredRecommendations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return recommendations.filter((recommendation) => {
      const job = recommendation.job;

      if (!job) return false;

      const matchesSearch =
        !normalizedSearch ||
        job.title.toLowerCase().includes(normalizedSearch) ||
        job.companyName.toLowerCase().includes(normalizedSearch) ||
        (job.location ?? "").toLowerCase().includes(normalizedSearch);

      const matchesRemote = !remoteOnly || job.remote;

      return matchesSearch && matchesRemote;
    });
  }, [recommendations, remoteOnly, search]);

  const summary = useMemo(() => {
    const jobs = recommendations.filter(
      (recommendation) => recommendation.job !== null,
    );

    const averageScore =
      jobs.length === 0
        ? 0
        : jobs.reduce(
            (sum, recommendation) => sum + recommendation.matchScore,
            0,
          ) / jobs.length;

    const totalGaps = jobs.reduce(
      (sum, recommendation) => sum + recommendation.skillGapCount,
      0,
    );

    const remoteCount = jobs.filter(
      (recommendation) => recommendation.job?.remote,
    ).length;

    return {
      jobs: jobs.length,
      averageScore,
      totalGaps,
      remoteCount,
    };
  }, [recommendations]);

  const openDetails = async (recommendation: RecommendedJob) => {
    setSelected(recommendation);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const result = await getJobRecommendationDetail(
        recommendation.jobId,
      );

      setDetail(result);
    } catch (requestError) {
      setDetailError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load job details.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const runFreshMatching = async () => {
    if (!jobProfileId?.trim() && !jobProfileSlug?.trim()) {
      return;
    }

    setGenerating(true);
    setError("");
    setSelected(null);
    setDetail(null);
    setFocusMode(false);

    try {
      await loadRecommendations(true);
    } finally {
      setGenerating(false);
    }
  };

  const toggleGaps = (jobId: string) => {
    setExpanded((current) => ({
      ...current,
      [jobId]: !current[jobId],
    }));
  };

  const handleProfileSelect = (profile: CuratedJobProfile) => {
    navigate(
      `/job-recommendations/${encodeURIComponent(profile.slug)}`,
    );
  };

  const renderProfilePicker = () => (
    <main className="job-recommendations-page">
      <header className="jr-page-header jr-profile-picker-header">
        <div>
          <div className="jr-eyebrow">JOB RECOMMENDATIONS</div>

          <h1>Search for the career profile you want to explore.</h1>

          <p>
            Choose a career direction first. SkillCompass will then search the
            current job catalog for actual openings classified under that role
            and compare them against your current skill profile.
          </p>
        </div>
      </header>

      <section className="jr-profile-picker clay-card">
        <div className="jr-profile-picker-copy">
          <div>
            <span className="jr-detail-section-kicker">
              CAREER PROFILE SEARCH
            </span>

            <h2>What role are you looking for?</h2>

            <p>
              Search by job title, domain, or a role alias. You can use this
              page even when you entered Job Recommendations directly.
            </p>
          </div>

          <span className="jr-profile-count-pill">
            {profileCatalog.length} profiles
          </span>
        </div>

        <label
          className="jr-profile-search"
          htmlFor="jr-profile-search-input"
        >
          <SvgIcon name="search" size={22} />

          <input
            id="jr-profile-search-input"
            type="search"
            value={profileSearch}
            onChange={(event) => setProfileSearch(event.target.value)}
            placeholder="Search e.g. Backend Developer, AI Engineer, Data Analyst..."
            autoComplete="off"
          />
        </label>

        {profileCatalogNotice && (
          <div className="jr-profile-picker-notice" role="status">
            {profileCatalogNotice}
          </div>
        )}

        {profileLoadState === "loading" ? (
          <div className="jr-profile-picker-loading">
            <div className="jr-spinner" aria-hidden="true" />

            <h2>Loading career profiles...</h2>

            <p>Preparing the available role catalog.</p>
          </div>
        ) : profileSearchResults.length > 0 ? (
          <div className="jr-profile-search-results">
            {profileSearchResults.map((profile) => (
              <button
                key={profile.slug}
                type="button"
                className="jr-profile-option clay-card"
                onClick={() => handleProfileSelect(profile)}
              >
                <span className="jr-profile-option-mark">
                  {profile.title
                    .split(/\s+/)
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>

                <span className="jr-profile-option-copy">
                  <strong>{profile.title}</strong>

                  <span>{profile.domain}</span>

                  <small>
                    {profile.skills.length} role skills · Explore actual
                    openings
                  </small>
                </span>

                <SvgIcon name="arrow" size={20} />
              </button>
            ))}
          </div>
        ) : (
          <div className="jr-profile-picker-empty">
            <span aria-hidden="true">
              <SvgIcon name="search" size={28} />
            </span>

            <h2>No career profile found.</h2>

            <p>Try a different role title, alias, or domain.</p>
          </div>
        )}

      </section>
    </main>
  );

  if (!hasJobProfile) {
    return renderProfilePicker();
  }

  return (
    <main className="job-recommendations-page">
      <header className="jr-page-header">
        <div>
          <div className="jr-eyebrow">JOB RECOMMENDATIONS</div>

          <h1>Actual openings for your selected career direction.</h1>

          <p>
            Only openings classified under {selectedProfileTitle} are
            evaluated. The gaps shown on each opening are specific to that
            opportunity.
          </p>
        </div>

        <div className="jr-header-actions">
          <button
            type="button"
            className="jr-secondary-button"
            onClick={() =>
              void loadRecommendations()
            }
            disabled={loading || generating}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="jr-primary-button"
            onClick={() => void runFreshMatching()}
            disabled={loading || generating}
          >
            {generating ? "Re-matching..." : "Recalculate Matches"}
          </button>
        </div>
      </header>

      {error && (
        <section className="jr-alert" role="alert">
          <strong>Recommendation service:</strong> {error}
        </section>
      )}

      <section
        className="jr-summary-grid"
        aria-label="Recommendation summary"
      >
        <article className="jr-summary-card clay-card">
          <span>OPENINGS EVALUATED</span>

          <strong>{summary.jobs}</strong>

          <small>Openings with matched skill data</small>
        </article>

        <article className="jr-summary-card clay-card">
          <span>AVERAGE MATCH</span>

          <strong>{summary.averageScore.toFixed(1)}%</strong>

          <small>Across currently loaded recommendations</small>
        </article>

        <article className="jr-summary-card clay-card">
          <span>SKILL GAPS</span>

          <strong>{summary.totalGaps}</strong>

          <small>Opening-specific development areas</small>
        </article>

        <article className="jr-summary-card clay-card">
          <span>REMOTE OPENINGS</span>

          <strong>{summary.remoteCount}</strong>

          <small>Available in the current result set</small>
        </article>
      </section>

      <section className="jr-toolbar clay-card">
        <div className="jr-search-wrap">
          <label htmlFor="jr-search">Search openings</label>

          <input
            id="jr-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Role, company, or location"
          />
        </div>

        <label className="jr-toggle">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(event) => setRemoteOnly(event.target.checked)}
          />

          <span>Remote only</span>
        </label>

        <div className="jr-result-count">
          Showing {filteredRecommendations.length} of{" "}
          {recommendations.length}
        </div>
      </section>

      <div className="jr-focus-toolbar" aria-label="Skill breakdown view mode">
        <div className="jr-focus-control">
          <div className="jr-focus-copy">
            <strong>{focusMode ? "Focus Mode" : "Normal Mode"}</strong>
            <small>Press F to switch</small>
          </div>

          <button
            type="button"
            className={`jr-focus-switch ${
              focusMode ? "is-active" : ""
            } ${!selected || !detail ? "is-disabled" : ""}`.trim()}
            onClick={() => setFocusMode((current) => !current)}
            aria-pressed={focusMode}
            aria-label={`Switch to ${focusMode ? "normal" : "focus"} mode`}
            title={
              selected && detail
                ? "Toggle Skill Breakdown Focus Mode (F)"
                : "Select an opening to enable Focus Mode"
            }
            disabled={!selected || !detail || detailLoading}
          >
            <span className="jr-focus-thumb" />
          </button>
        </div>
      </div>

      <div
        className={`jr-content-grid ${
          focusMode ? "jr-focus-mode" : ""
        }`.trim()}
      >
        <section className="jr-list-panel">
          {loading && recommendations.length === 0 ? (
            <div className="jr-loading clay-card">
              <div className="jr-spinner" aria-hidden="true" />

              <h2>Building your recommendation set...</h2>

              <p>
                Matching your current skills against the available openings
                for the selected career direction.
              </p>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="jr-empty-list clay-card">
              <h2>No matching openings in this result set.</h2>

              <p>
                Try a different search or refresh the recommendations after
                more jobs have been synchronized.
              </p>
            </div>
          ) : (
            filteredRecommendations.map((recommendation) => {
              const job = recommendation.job;

              if (!job) return null;

              const scoreTone = getScoreTone(
                recommendation.matchScore,
              );

              const isExpanded =
                expanded[recommendation.jobId] ?? false;

              return (
                <article
                  key={recommendation.jobId}
                  className={`jr-job-card clay-card ${
                    selected?.jobId === recommendation.jobId
                      ? "is-selected"
                      : ""
                  }`}
                >
                  <div className="jr-job-card-top">
                    <div>
                      <span className="jr-source-badge">
                        {job.source}
                      </span>

                      <h2>{job.title}</h2>

                      <p className="jr-company">
                        {job.companyName}
                      </p>
                    </div>

                    <div
                      className={`jr-score jr-score-${scoreTone}`}
                    >
                      <strong>
                        {recommendation.matchScore.toFixed(1)}%
                      </strong>

                      <span>
                        {getScoreLabel(
                          recommendation.matchScore,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="jr-job-meta">
                    <span>
                      {formatLocation(
                        job.location,
                        job.remote,
                      )}
                    </span>

                    <span>
                      {job.employmentType ||
                        "Employment type unavailable"}
                    </span>

                    <span>
                      Posted {formatDate(job.postedAt)}
                    </span>
                  </div>

                  <p className="jr-explanation">
                    {recommendation.explanation}
                  </p>

                  <div className="jr-gap-summary">
                    <div>
                      <strong>
                        {recommendation.skillGapCount}
                      </strong>

                      <span>
                        opening-specific skill gaps
                      </span>
                    </div>

                    <div>
                      <strong>
                        {(
                          recommendation.skillCoverage * 100
                        ).toFixed(1)}
                        %
                      </strong>

                      <span>
                        weighted skill coverage
                      </span>
                    </div>
                  </div>

                  {recommendation.gaps.length > 0 && (
                    <div className="jr-gap-preview">
                      <div className="jr-gap-preview-header">
                        <span>PRIORITY GAPS</span>

                        <button
                          type="button"
                          onClick={() =>
                            toggleGaps(
                              recommendation.jobId,
                            )
                          }
                        >
                          {isExpanded ? "Hide" : "Show"} gaps
                        </button>
                      </div>

                      <div className="jr-gap-chips">
                        {(isExpanded
                          ? recommendation.gaps
                          : recommendation.gaps.slice(
                              0,
                              3,
                            )
                        ).map((gap) => (
                          <span
                            key={gap.skillId}
                            className="jr-gap-chip"
                          >
                            {gap.skillName} ·{" "}
                            {gap.currentScore.toFixed(0)}
                            /100
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="jr-card-actions">
                    <button
                      type="button"
                      className="jr-secondary-button"
                      onClick={() =>
                        void openDetails(
                          recommendation,
                        )
                      }
                    >
                      View Skill Breakdown
                    </button>

                    <button
                      type="button"
                      className="jr-primary-button"
                      onClick={() => {
                        window.open(
                          job.url,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }}
                    >
                      Open Opportunity
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <aside className="jr-detail-panel clay-card">
          {!selected ? (
            <div className="jr-detail-placeholder">
              <div
                className="jr-detail-icon"
                aria-hidden="true"
              >
                <SvgIcon name="target" size={30} />
              </div>

              <h2>Select an opening</h2>

              <p>
                Choose an opening to inspect its requirements, your current
                signal, and the opening-specific skills currently below the
                configured threshold.
              </p>
            </div>
          ) : detailLoading ? (
            <div className="jr-detail-placeholder">
              <div
                className="jr-spinner"
                aria-hidden="true"
              />

              <h2>Loading opening details...</h2>

              <p>
                Fetching the detailed skill breakdown.
              </p>
            </div>
          ) : detailError ? (
            <div className="jr-detail-placeholder">
              <h2>Unable to load this opening.</h2>

              <p>{detailError}</p>

              <button
                type="button"
                className="jr-secondary-button"
                onClick={() =>
                  void openDetails(selected)
                }
              >
                Try Again
              </button>
            </div>
          ) : detail ? (
            <>
              <div className="jr-detail-header">
                <div>
                  <span className="jr-source-badge">
                    {detail.job.source}
                  </span>

                  <h2>{detail.job.title}</h2>

                  <p>{detail.job.companyName}</p>
                </div>

                {detail.match && (
                  <div
                    className={`jr-detail-score jr-score-${getScoreTone(
                      detail.match.matchScore,
                    )}`}
                  >
                    <strong>
                      {detail.match.matchScore.toFixed(
                        1,
                      )}
                      %
                    </strong>

                    <span>profile match</span>
                  </div>
                )}
              </div>

              {detail.match && (
                <div className="jr-detail-stat-row">
                  <div>
                    <span>Coverage</span>

                    <strong>
                      {(
                        detail.match.skillCoverage * 100
                      ).toFixed(1)}
                      %
                    </strong>
                  </div>

                  <div>
                    <span>Gaps</span>

                    <strong>
                      {detail.match.skillGapCount}
                    </strong>
                  </div>
                </div>
              )}

              <section className="jr-detail-section jr-role-requirements-card">
                <div className="jr-role-requirements-head">
                  <div>
                    <span className="jr-detail-section-kicker">
                      ROLE REQUIREMENTS
                    </span>

                    <h3>Skill landscape</h3>
                  </div>

                  <span className="jr-mini-pill">
                    {detail.skills.length} opening skills
                  </span>
                </div>

                <div className="jr-role-skill-table">
                  {detail.skills.map((skill) => {
                    const gap = detail.gaps.find(
                      (item) => item.skillId === skill.skillId,
                    );

                    const importance = Math.round(
                      skill.importance * 100,
                    );

                    return (
                      <div
                        key={`${skill.skillId}-${skill.requirementType}`}
                        className={`jr-role-skill-row ${
                          gap ? "has-gap" : "meets-threshold"
                        }`}
                      >
                        <div className="jr-role-skill-name">
                          <strong>{skill.name}</strong>

                          <span>
                            {skill.requirementType ===
                            "REQUIRED"
                              ? "Required opening skill"
                              : "Preferred opening skill"}
                          </span>
                        </div>

                        <div className="jr-role-skill-meter-wrap">
                          <div className="jr-role-skill-meter-labels">
                            <span>Your signal</span>

                            <strong>
                              {gap
                                ? `${gap.currentScore.toFixed(0)}%`
                                : "Meets threshold"}
                            </strong>
                          </div>

                          <div className="jr-bar-track jr-user-signal-track">
                            {gap ? (
                              <i
                                className="jr-bar-user"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      gap.currentScore,
                                    ),
                                  )}%`,
                                }}
                              />
                            ) : (
                              <i className="jr-bar-user jr-bar-met" />
                            )}
                          </div>

                          <div className="jr-role-skill-meter-labels jr-opening-reference-labels">
                            <span>Opening importance</span>

                            <strong>{importance}%</strong>
                          </div>

                          <div className="jr-bar-track jr-opening-reference-track">
                            <i
                              className="jr-bar-role"
                              style={{
                                width: `${importance}%`,
                              }}
                            />
                          </div>
                        </div>

                        <span
                          className={`jr-state-pill ${
                            gap ? "gap" : "matched"
                          }`}
                        >
                          {gap
                            ? "Gap"
                            : "Demonstrated"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="jr-detail-section">
                <div className="jr-detail-section-heading">
                  <span>OPENING-SPECIFIC GAPS</span>

                  <small>
                    {detail.gaps.length} areas
                  </small>
                </div>

                {detail.gaps.length === 0 ? (
                  <div className="jr-no-gaps">
                    No opening-specific gaps are currently
                    recorded.
                  </div>
                ) : (
                  <div className="jr-detailed-gaps">
                    {detail.gaps.map((gap) => (
                      <div
                        key={gap.skillId}
                        className="jr-detailed-gap"
                      >
                        <div>
                          <strong>
                            {gap.skillName}
                          </strong>

                          <span>
                            Current{" "}
                            {gap.currentScore.toFixed(
                              0,
                            )}
                            /100 · Gap{" "}
                            {gap.gapScore.toFixed(0)}
                          </span>
                        </div>

                        <b>
                          Priority{" "}
                          {gap.priority.toFixed(1)}
                        </b>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="jr-detail-actions">
                <button
                  type="button"
                  className="jr-primary-button"
                  onClick={() => {
                    window.open(
                      detail.job.url,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }}
                >
                  Open Opportunity
                </button>

                <button
                  type="button"
                  className="jr-secondary-button"
                  onClick={() => {
                    setSelected(null);
                    setDetail(null);
                    setFocusMode(false);
                  }}
                >
                  Close
                </button>
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </main>
  );
}