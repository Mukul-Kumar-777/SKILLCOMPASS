import { SvgIcon } from '../icons/SvgIcon';

interface Props {
  lastSynced: string;
  onSync: () => void;
  syncing: boolean;
  onDisconnect: () => void;
  onConnect: () => void;
  connected: boolean;
  username: string;
  repositoryCount: number;
  publicCount: number;
  privateCount: number;
}

export default function GithubSummary({
  lastSynced,
  onSync,
  syncing,
  onDisconnect,
  onConnect,
  connected,
  username,
  repositoryCount,
  publicCount,
  privateCount,
}: Props) {
  return (
    <section className="gh-summary-grid gh-reveal gh-delay-1">
      <article className="gh-summary-card gh-connection-card">
        <div className="gh-summary-icon mint"><SvgIcon name="link" size={28} /></div>
        <div className="gh-summary-copy">
          <div className="gh-status"><span className={connected ? '' : 'offline'} />{connected ? 'Connected' : 'Not Connected'}</div>
          <strong>{connected ? username : 'Connect your GitHub account'}</strong>
          <small>{connected ? 'GitHub account linked successfully.' : repositoryCount ? 'GitHub is disconnected. Saved repositories remain available.' : 'Connect GitHub to fetch and analyze your repositories.'}</small>
        </div>
        <button className="gh-small-button" onClick={connected ? onDisconnect : onConnect}>
          {connected ? 'Disconnect' : 'Connect GitHub'}
        </button>
      </article>

      <article className="gh-summary-card">
        <div className="gh-summary-icon purple"><SvgIcon name="folder" size={28} /></div>
        <div className="gh-summary-copy"><strong className="gh-number">{repositoryCount}</strong><span>Repositories</span><small>{publicCount} public · {privateCount} private</small></div>
      </article>

      <article className="gh-summary-card">
        <div className="gh-summary-icon cyan"><SvgIcon name="refresh" size={29} /></div>
        <div className="gh-summary-copy"><small>Last synced</small><strong className="gh-sync-time">{lastSynced}</strong></div>
        <button className="gh-sync-button" onClick={connected ? onSync : onConnect} disabled={syncing}><SvgIcon name={connected ? 'refresh' : 'github'} size={16} />{syncing ? 'Syncing…' : connected ? 'Sync now' : 'Connect to Sync'}</button>
      </article>
    </section>
  );
}
