import { useEffect, useMemo, useState } from 'react';
import { SvgIcon } from '../../components/icons/SvgIcon';
import { getRepositoryAnalysisRuns } from '../../api/analysis';
import { getCachedGithubRepositories } from '../../api/github';
import type { Repository } from '../../types/github';
import { navigate } from '../../router/appRouter';
import './analysis-history.css';

type HistoryFilter = 'All' | 'Completed' | 'Running' | 'Failed';

interface AnalysisHistoryItem {
  id: string;
  repositoryId: string;
  repositoryName: string;
  fullName?: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
}

function formatDateParts(value?: string | null) {
  if (!value) return { date: 'Unknown date', time: '' };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: 'Unknown date', time: '' };

  return {
    date: parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: parsed.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

function formatDuration(startedAt?: string | null, completedAt?: string | null) {
  if (!startedAt || !completedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return '—';
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function normalizeStatus(status: string) {
  return status.trim().toUpperCase();
}

function statusTone(status: string) {
  switch (normalizeStatus(status)) {
    case 'COMPLETED':
      return 'completed';
    case 'RUNNING':
    case 'QUEUED':
      return 'running';
    case 'FAILED':
    case 'CANCELLED':
      return 'failed';
    default:
      return 'neutral';
  }
}

function statusLabel(status: string) {
  switch (normalizeStatus(status)) {
    case 'COMPLETED':
      return 'Completed';
    case 'RUNNING':
      return 'Running';
    case 'QUEUED':
      return 'Queued';
    case 'FAILED':
      return 'Failed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status || 'Unknown';
  }
}

export default function AnalysisHistory() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [items, setItems] = useState<AnalysisHistoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      // Analysis history is a SkillCompass data view, not a GitHub-sync view.
      // Use the last persisted repository snapshot already available in the
      // browser and never contact GitHub just to render history.
      const repos = getCachedGithubRepositories().repositories;
      setRepositories(repos);

      // Do not fan out one request per repository in parallel. The analysis API is
      // intentionally read-throttled so Skills, Analysis and History cannot
      // accidentally trigger a rate-limit burst.
      const runGroups: AnalysisHistoryItem[][] = [];

      for (const repo of repos) {
        try {
          const runs = await getRepositoryAnalysisRuns(repo.id);
          runGroups.push(
            runs.map(run => ({
              id: run.id,
              repositoryId: repo.id,
              repositoryName: repo.name,
              fullName: undefined,
              status: run.status,
              startedAt: run.startedAt,
              completedAt: run.completedAt,
              errorMessage: run.errorMessage,
            } satisfies AnalysisHistoryItem)),
          );
        } catch {
          runGroups.push([]);
        }
      }

      const flattened = runGroups.flat().sort((a, b) => {
        const aTime = new Date(a.startedAt ?? a.completedAt ?? 0).getTime();
        const bTime = new Date(b.startedAt ?? b.completedAt ?? 0).getTime();
        return bTime - aTime;
      });

      setItems(flattened);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load analysis history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return items.filter(item => {
      const matchesQuery =
        !normalized ||
        item.repositoryName.toLowerCase().includes(normalized) ||
        (item.fullName ?? '').toLowerCase().includes(normalized) ||
        item.status.toLowerCase().includes(normalized);

      const normalizedItemStatus = normalizeStatus(item.status);
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Completed' && normalizedItemStatus === 'COMPLETED') ||
        (filter === 'Running' && ['QUEUED', 'RUNNING'].includes(normalizedItemStatus)) ||
        (filter === 'Failed' && ['FAILED', 'CANCELLED'].includes(normalizedItemStatus));

      return matchesQuery && matchesFilter;
    });
  }, [items, query, filter]);

  const completedCount = items.filter(item => normalizeStatus(item.status) === 'COMPLETED').length;
  const runningCount = items.filter(item => ['QUEUED', 'RUNNING'].includes(normalizeStatus(item.status))).length;
  const failedCount = items.filter(item => ['FAILED', 'CANCELLED'].includes(normalizeStatus(item.status))).length;

  return (
    <main className="analysis-history-page">
      <header className="analysis-history-header">
        <div className="analysis-history-hero-main">
          <div className="analysis-history-hero-icon" aria-hidden="true">
            <SvgIcon name="chart" size={56} />
          </div>

          <div className="analysis-history-heading">
            <span className="analysis-history-eyebrow">Repository Intelligence</span>
            <h1><span>Analysis</span> <em>History</em></h1>
            <p>Review every repository analysis run and open the complete report for any run.</p>
          </div>
        </div>

        <div className="analysis-history-hero-art">
          <div className="analysis-history-quote" aria-hidden="true">
            <span>“</span>
            <p>Your code tells a story.<br />Let’s turn it into opportunities.</p>
            <b>”</b>
          </div>

        </div>
      </header>

      <section className="analysis-history-metrics">
        <Metric icon="repo" value={repositories.length} label="Repositories" tone="blue" />
        <Metric icon="sparkle" value={completedCount} label="Completed analyses" tone="cyan" />
        <Metric icon="loader" value={runningCount} label="In progress" tone="purple" />
        <Metric icon="alert" value={failedCount} label="Failed runs" tone="orange" />
      </section>

      <section className="analysis-history-toolbar">
        <div className="analysis-history-search">
          <SvgIcon name="search" size={18} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search repositories or analysis runs..."
            aria-label="Search analysis history"
          />
        </div>

        <div className="analysis-history-filters" role="tablist" aria-label="Analysis status filters">
          {(['All', 'Completed', 'Running', 'Failed'] as HistoryFilter[]).map(item => (
            <button
              key={item}
              type="button"
              className={filter === item ? 'active' : ''}
              onClick={() => setFilter(item)}
              role="tab"
              aria-selected={filter === item}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="analysis-history-refresh analysis-history-toolbar-refresh"
          onClick={() => void loadHistory(true)}
          disabled={refreshing}
        >
          <SvgIcon name={refreshing ? 'loader' : 'refresh'} size={18} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </section>

      {loading ? (
        <HistoryLoading />
      ) : error ? (
        <section className="analysis-history-state">
          <div className="analysis-history-state-icon error">
            <SvgIcon name="alert" size={26} />
          </div>
          <h2>Couldn’t load analysis history</h2>
          <p>{error}</p>
          <button type="button" onClick={() => void loadHistory()}>Try again</button>
        </section>
      ) : filteredItems.length === 0 ? (
        <section className="analysis-history-state">
          <div className="analysis-history-state-icon">
            <SvgIcon name="chart" size={26} />
          </div>
          <h2>No analysis runs found</h2>
          <p>
            {items.length
              ? 'Try a different search or filter.'
              : 'Analyze a repository from GitHub Workspace and its run will appear here.'}
          </p>
        </section>
      ) : (
        <section className="analysis-history-list" aria-label="Analysis history">
          {filteredItems.map(item => (
            <AnalysisHistoryCard key={item.id} item={item} />
          ))}
        </section>
      )}
    </main>
  );
}

function Metric({ icon, value, label, tone }: { icon: string; value: number; label: string; tone: string }) {
  return (
    <article className={`analysis-history-metric tone-${tone}`}>
      <span className="analysis-history-metric-icon">
        <SvgIcon name={icon} size={22} />
      </span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </article>
  );
}

function AnalysisHistoryCard({ item }: { item: AnalysisHistoryItem }) {
  const tone = statusTone(item.status);
  const canOpen = normalizeStatus(item.status) === 'COMPLETED';

  return (
    <article className={`analysis-history-card status-${tone}`}>
      <div className="analysis-history-card-main">
        <div className="analysis-history-repo-icon">
          <SvgIcon name="repo" size={23} />
        </div>

        <div className="analysis-history-card-copy">
          <div className="analysis-history-card-title-row">
            <h2>{item.repositoryName}</h2>
            <span className={`analysis-status ${tone}`}>
              <i />
              {statusLabel(item.status)}
            </span>
          </div>

          <p>{item.fullName ?? 'Repository analysis run'}</p>

          {item.errorMessage && <small className="analysis-history-error">{item.errorMessage}</small>}
        </div>
      </div>

      <div className="analysis-history-card-meta">
        <div>
          <span>Started</span>
          <strong>
            <span className="meta-date">{formatDateParts(item.startedAt).date}</span>
            <span className="meta-time">{formatDateParts(item.startedAt).time}</span>
          </strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>
            <span className="meta-date">{formatDateParts(item.completedAt).date}</span>
            <span className="meta-time">{formatDateParts(item.completedAt).time}</span>
          </strong>
        </div>
        <div>
          <span>Duration</span>
          <strong>{formatDuration(item.startedAt, item.completedAt)}</strong>
        </div>
      </div>

      <div className="analysis-history-card-action">
        <button
          type="button"
          disabled={!canOpen}
          onClick={() => canOpen && navigate(`/analysis/${item.id}`)}
          title={canOpen ? 'Open full analysis' : 'A completed run is required'}
        >
          {canOpen ? 'View Full Analysis' : statusLabel(item.status)}
          {canOpen && <SvgIcon name="arrow" size={17} />}
        </button>
      </div>
    </article>
  );
}

function HistoryLoading() {
  return (
    <section className="analysis-history-list" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="analysis-history-skeleton" key={index}>
          <span />
          <div>
            <i />
            <b />
            <em />
          </div>
          <strong />
        </div>
      ))}
    </section>
  );
}
