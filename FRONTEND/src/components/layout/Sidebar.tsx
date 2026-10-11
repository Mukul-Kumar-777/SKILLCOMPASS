import { useState } from 'react';
import { navigate } from '../../router/appRouter';
import { SvgIcon } from '../icons/SvgIcon';

type NavItem = {
  id: string;
  label: string;
  icon: string;
  path?: string;
};

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'home', path: '/' },
  { id: 'github', label: 'GitHub', icon: 'github', path: '/github' },
  { id: 'skills', label: 'Skills', icon: 'layers', path: '/skills' },
  { id: 'analysis', label: 'Analysis', icon: 'chart', path: '/analysis' },
  { id: 'job-profiles', label: 'Job Profiles', icon: 'briefcase', path: '/job-profiles' },
  {
    id: 'job-recommendations',
    label: 'Recommendations',
    icon: 'target',
    path: '/job-recommendations',
  },
];

const settingsItems: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
  { id: 'help', label: 'Help', icon: 'help', path: '/help' },
];

function getActiveId(path: string): string {
  if (path === '/github' || path.startsWith('/github/')) return 'github';

  if (
    path === '/analysis' ||
    path.startsWith('/analysis/') ||
    path === '/analysis-history'
  ) {
    return 'analysis';
  }

  if (path === '/skills' || path.startsWith('/skills/')) return 'skills';

  if (path === '/job-profiles' || path.startsWith('/job-profiles/')) {
    return 'job-profiles';
  }

  if (
    path === '/job-recommendations' ||
    path.startsWith('/job-recommendations/')
  ) {
    return 'job-recommendations';
  }

  if (path === '/settings' || path.startsWith('/settings/')) return 'settings';

  if (path === '/help' || path.startsWith('/help/')) return 'help';

  return 'overview';
}

function SkillCompassLogo() {
  return (
    <span className="sidebar-logo" aria-hidden="true">
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
        focusable="false"
      >
        <defs>
          <linearGradient
            id="sidebar-brand-gradient"
            x1="4"
            y1="4"
            x2="25"
            y2="27"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#BBD7FF" />
            <stop offset="0.45" stopColor="#5D9EFF" />
            <stop offset="1" stopColor="#2056CD" />
          </linearGradient>
        </defs>
        <path
          d="M15 2.7 18.7 11.3 27.2 15l-8.5 3.7L15 27.3l-3.7-8.6L2.8 15l8.5-3.7z"
          fill="url(#sidebar-brand-gradient)"
        />
        <circle cx="15" cy="15" r="2.4" fill="#FFF" />
      </svg>
    </span>
  );
}

export default function Sidebar({ path }: { path: string }) {
  const [notice, setNotice] = useState('');
  const active = getActiveId(path);

  const select = (item: NavItem) => {
    setNotice('');

    if (item.path) {
      navigate(item.path);
      return;
    }

    setNotice(`${item.label} is the next SkillCompass workspace.`);
  };

  return (
    <aside className="sidebar clay-card">
      <div className="sidebar-header">
        <div className="brand-lockup">
          <SkillCompassLogo />
          <div className="brand-copy">
            <div className="brand-name">SkillCompass</div>
            <div className="brand-tagline">
              Your Code. A Brighter Tomorrow.
            </div>
          </div>
        </div>
      </div>

      <nav className="nav-stack" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => select(item)}
            >
              <span className="nav-icon" aria-hidden="true">
                <SvgIcon name={item.icon} size={22} />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-divider" />

      <nav className="nav-stack bottom-nav" aria-label="Secondary navigation">
        {settingsItems.map((item) => {
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => select(item)}
            >
              <span className="nav-icon" aria-hidden="true">
                <SvgIcon name={item.icon} size={21} />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className="build-card"
        onClick={() =>
          setNotice('Your next growth step is one analysis away.')
        }
      >
        <div className="build-title">
          Build Today
          <br />
          A Better You
        </div>

        <div className="build-copy">
          Your skills have
          <br />
          more potential
          <br />
          than you think.
        </div>

        <div className="build-arrow" aria-hidden="true">
          <SvgIcon name="arrow" size={23} />
        </div>

        <div className="build-orb orb-blue" aria-hidden="true" />
        <div className="build-orb orb-purple" aria-hidden="true" />
        <div className="build-orb orb-violet" aria-hidden="true" />
      </button>

      {notice && (
        <div className="sidebar-notice" role="status">
          {notice}
        </div>
      )}
    </aside>
  );
}
