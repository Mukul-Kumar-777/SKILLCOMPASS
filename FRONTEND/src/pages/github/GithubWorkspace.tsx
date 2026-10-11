import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { SvgIcon } from '../../components/icons/SvgIcon';
import GithubHero from '../../components/github/GithubHero';
import GithubSummary from '../../components/github/GithubSummary';
import RepositoryList from '../../components/github/RepositoryList';
import RepositoryDetails from '../../components/github/RepositoryDetails';
import GithubConnectionBenefits from '../../components/github/GithubConnectionBenefits';
import {
  ApiError,
  formatCachedSyncTime,
  getCachedGithubRepositories,
  isGithubConnectionPending,
  markGithubDisconnected,
  startGithubConnection,
  syncGithubRepositories,
  updateCachedGithubRepositories,
} from '../../api/github';
import { getAnalysisStatus, getRepositoryAnalysisRuns, startRepositoryAnalysis } from '../../api/analysis';
import type { Repository } from '../../types/github';
import './github-workspace.css';

type Filter = 'All' | 'Public' | 'Private' | 'Updated';

export default function GithubWorkspace() {
  const cachedGithub = getCachedGithubRepositories();
  const [repositories, setRepositories] = useState<Repository[]>(cachedGithub.repositories);
  const [selectedId, setSelectedId] = useState(cachedGithub.repositories[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [syncing, setSyncing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState(formatCachedSyncTime(cachedGithub.lastSyncedAt));
  const [toast, setToast] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState(cachedGithub.username ?? '');
  const [focusMode, setFocusMode] = useState(false);

  const selected = repositories.find(repo => repo.id === selectedId);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let result = repositories.filter(repo => {
      const matchesQuery = !normalized || [repo.name, repo.description, repo.language, ...repo.topics].some(value => value.toLowerCase().includes(normalized));
      const matchesFilter = filter === 'All' || (filter === 'Public' && repo.visibility === 'Public') || (filter === 'Private' && repo.visibility === 'Private') || (filter === 'Updated' && repo.updatedHours <= 168);
      return matchesQuery && matchesFilter;
    });
    if (filter === 'Updated') result = [...result].sort((a, b) => a.updatedHours - b.updatedHours);
    return result;
  }, [repositories, query, filter]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const performSync = async (showSuccess = true) => {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await syncGithubRepositories();
      setRepositories(result.repositories);
      setConnected(true);
      setUsername(result.username || username || 'GitHub user');
      setLastSynced('just now');
      setSelectedId(current => result.repositories.some(repo => repo.id === current) ? current : (result.repositories[0]?.id ?? ''));
      if (showSuccess) notify(result.repositories.length ? `Synced ${result.repositories.length} GitHub repositories.` : 'GitHub sync completed.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setConnected(false);
        if (showSuccess) notify('GitHub connection is required. Connect GitHub to continue.');
      } else {
        if (showSuccess) notify(error instanceof Error ? error.message : 'GitHub sync failed.');
      }
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    // Do not sync GitHub just because the page was opened. Reconcile only the
    // SkillCompass-owned analysis state so previously analyzed repositories do
    // not fall back to "Not Analyzed" after a refresh or reconnect.
    if (isGithubConnectionPending()) {
      void performSync(false);
    }

    // The repository cache already contains the last known analysis state.
    // Do not fan out history requests for every repository when this page opens;
    // Analysis History is responsible for live run reconciliation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Focus mode shortcut: F toggles between Normal Mode and Focus Mode.
  // Ignore the shortcut while the user is typing in a form control.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setFocusMode(current => !current);
      } else if (event.key === 'Escape') {
        setFocusMode(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const analyze = async (id: string) => {
    if (analyzingId) return;

    setAnalyzingId(id);
    setRepositories(items => {
      const next = items.map(repo => repo.id === id ? { ...repo, status: 'Analyzing' as const } : repo);
      updateCachedGithubRepositories(next);
      return next;
    });

    try {
      let run;

      try {
        run = await startRepositoryAnalysis(id);
      } catch (error) {
        // A previous run may still be queued/running. In that case attach to the
        // existing run instead of creating a duplicate run and surfacing a 409.
        if (!(error instanceof ApiError && error.status === 409)) throw error;

        const runs = await getRepositoryAnalysisRuns(id);
        run = runs
          .filter(item => item.status === 'QUEUED' || item.status === 'RUNNING')
          .sort((a, b) => {
            const aTime = new Date(a.createdAt ?? a.startedAt ?? 0).getTime();
            const bTime = new Date(b.createdAt ?? b.startedAt ?? 0).getTime();
            return bTime - aTime;
          })[0];

        if (!run) throw error;
      }

      let current = run;

      for (let attempt = 0; attempt < 30; attempt += 1) {
        if (current.status === 'COMPLETED' || current.status === 'FAILED' || current.status === 'CANCELLED') break;
        await new Promise(resolve => window.setTimeout(resolve, 3000));
        current = await getAnalysisStatus(run.id);
      }

      if (current.status === 'COMPLETED') {
        setRepositories(items => {
          const next = items.map(repo => repo.id === id
            ? { ...repo, status: 'Analyzed' as const, analyzedAt: current.completedAt ?? 'just now' }
            : repo);
          updateCachedGithubRepositories(next);
          return next;
        });
        notify('Repository analysis completed. Skills are ready to review.');
      } else if (current.status === 'FAILED') {
        setRepositories(items => {
          const next = items.map(repo => repo.id === id ? { ...repo, status: 'Not Analyzed' as const } : repo);
          updateCachedGithubRepositories(next);
          return next;
        });
        notify(current.errorMessage ?? 'Repository analysis failed.');
      } else if (current.status === 'CANCELLED') {
        setRepositories(items => {
          const next = items.map(repo => repo.id === id ? { ...repo, status: 'Not Analyzed' as const } : repo);
          updateCachedGithubRepositories(next);
          return next;
        });
        notify('Repository analysis was cancelled.');
      } else {
        // The old completed result still exists even when the current run did not
        // finish, so preserve the analyzed state when cached analysis metadata is
        // available.
        setRepositories(items => {
          const next = items.map(repo => repo.id === id ? { ...repo, status: repo.analyzedAt ? 'Analyzed' as const : 'Not Analyzed' as const } : repo);
          updateCachedGithubRepositories(next);
          return next;
        });
        notify('Repository analysis did not complete. Check the analysis status.');
      }
    } catch (error) {
      setRepositories(items => {
        const next = items.map(repo => repo.id === id ? { ...repo, status: repo.analyzedAt ? 'Analyzed' as const : 'Not Analyzed' as const } : repo);
        updateCachedGithubRepositories(next);
        return next;
      });
      notify(error instanceof Error ? error.message : 'Repository analysis failed.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const disconnect = () => {
    setDisconnectOpen(false);

    // Disconnect only the provider connection. Never erase repositories,
    // selected repository state, or existing analysis data from the UI.
    markGithubDisconnected();
    setConnected(false);
    notify('GitHub disconnected. Existing repositories and analysis remain available.');
  };

  const publicCount = repositories.filter(repo => repo.visibility === 'Public').length;
  const privateCount = repositories.filter(repo => repo.visibility === 'Private').length;

  const githubThemeStyle = {
    '--gh-bg': 'var(--sc-bg)',
    '--gh-panel': 'var(--sc-card)',
    '--gh-panel-soft': 'var(--sc-card-soft)',
    '--gh-line': 'var(--sc-line)',
    '--gh-text': 'var(--sc-text)',
    '--gh-muted': 'var(--sc-copy)',
    '--gh-dim': 'var(--sc-dim)',
    '--gh-blue': 'var(--sc-blue)',
    '--gh-cyan': 'var(--sc-cyan)',
    '--gh-purple': 'var(--sc-purple)',
    '--gh-mint': 'var(--sc-mint)',
  } as CSSProperties;

  return (
    <main
      className="main-area github-workspace-page"
      style={githubThemeStyle}
    >
      <header className="gh-topbar gh-reveal">
        <div className="gh-account-actions">
          <div className="gh-popover-wrap">
            <button className="gh-icon-button" onClick={() => { setNotificationsOpen(v => !v); setProfileOpen(false); }} aria-label="Notifications"><SvgIcon name="bell" size={23} /><i /></button>
            {notificationsOpen && <div className="gh-popover gh-notification-pop"><strong>Notifications</strong><p>{connected ? 'Your GitHub workspace is connected.' : repositories.length ? 'GitHub is disconnected. Your saved repositories remain available.' : 'Connect GitHub to start importing repositories.'}</p><small>{syncing ? 'Repository synchronization is in progress.' : connected ? 'Sync when you want to import new GitHub changes.' : 'Reconnect GitHub when you need to sync new changes.'}</small></div>}
          </div>
          <div className="gh-popover-wrap">
            <button className="gh-profile-button" onClick={() => { setProfileOpen(v => !v); setNotificationsOpen(false); }}><span className="gh-avatar">RM</span><span><strong>Ravanansh Mukul</strong><small>Dream · Build · Grow</small></span><SvgIcon name="chevron" size={18} /></button>
            {profileOpen && <div className="gh-popover gh-profile-pop"><button>Profile</button><button>Workspace preferences</button><button>Sign out</button></div>}
          </div>
        </div>
      </header>

      <GithubHero />
      <GithubSummary
        lastSynced={lastSynced}
        onSync={() => void (connected ? performSync(true) : startGithubConnection())}
        syncing={syncing}
        onDisconnect={() => setDisconnectOpen(true)}
        onConnect={startGithubConnection}
        connected={connected}
        username={username || 'GitHub user'}
        repositoryCount={repositories.length}
        publicCount={publicCount}
        privateCount={privateCount}
      />

      <GithubConnectionBenefits />

      <div className="gh-focus-toolbar">
        <div className="gh-focus-control">
          <div className="gh-focus-copy">
            <strong>{focusMode ? 'Focus Mode' : 'Normal Mode'}</strong>
            <small>Press F to switch</small>
          </div>
          <button
            type="button"
            className={`gh-focus-switch ${focusMode ? 'is-active' : ''}`}
            onClick={() => setFocusMode(current => !current)}
            aria-pressed={focusMode}
            aria-label={`Switch to ${focusMode ? 'normal' : 'focus'} mode`}
            title="Toggle Focus Mode (F)"
          >
            <span className="gh-focus-thumb" />
          </button>
        </div>
      </div>

      <section className={`gh-workspace-grid ${focusMode ? 'gh-workspace-focus' : ''}`.trim()}>
        <RepositoryList
          repositories={filtered}
          selectedId={selectedId}
          query={query}
          filter={filter}
          onQuery={setQuery}
          onFilter={setFilter}
          onSelect={(repo: Repository) => setSelectedId(repo.id)}
        />
        {selected ? (
          <RepositoryDetails repository={selected} onAnalyze={analyze} analyzing={analyzingId === selected.id} />
        ) : (
          <section className="gh-panel gh-details-panel gh-reveal gh-delay-3 gh-empty-details">
            <div className="gh-empty"><SvgIcon name="github" size={28} /><strong>{repositories.length ? 'No repository selected' : connected ? 'No repositories found' : 'Connect GitHub to continue'}</strong><span>{repositories.length ? 'Choose a repository from the list to inspect it.' : connected ? 'Your GitHub account is connected, but no repositories were returned.' : 'Use the Connect GitHub button above to fetch your repositories.'}</span>{!connected && !repositories.length && <button className="gh-primary-action" onClick={startGithubConnection}>Connect GitHub</button>}</div>
          </section>
        )}
      </section>

      {disconnectOpen && <div className="gh-modal-backdrop" onMouseDown={() => setDisconnectOpen(false)}><div className="gh-modal" onMouseDown={e => e.stopPropagation()}><button className="gh-modal-close" onClick={() => setDisconnectOpen(false)}><SvgIcon name="x" size={18} /></button><div className="gh-modal-icon"><SvgIcon name="link" size={25} /></div><h3>Disconnect GitHub?</h3><p>This disconnects GitHub syncing for this workspace. Your saved repositories, skills, and completed analyses remain available.</p><div><button className="gh-secondary-action" onClick={() => setDisconnectOpen(false)}>Cancel</button><button className="gh-danger-action" onClick={disconnect}>Disconnect</button></div></div></div>}
      {toast && <div className="gh-toast" role="status"><span><SvgIcon name="check" size={16} /></span>{toast}</div>}
    </main>
  );
}
