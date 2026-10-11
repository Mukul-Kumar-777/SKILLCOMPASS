import { useEffect, useMemo, useState } from 'react';
import avatarReference from '../../assets/avatar-reference.png';
import { navigate } from '../../router/appRouter';
import { SvgIcon } from '../../components/icons/SvgIcon';

type SettingsSection =
  | 'profile'
  | 'github'
  | 'career'
  | 'data'
  | 'security';

type User = {
  id?: string;
  email?: string;
  displayName?: string | null;
  createdAt?: string;
};

type SessionSummary = {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt?: string | null;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
};

type CareerPreferences = {
  domains: string[];
  roles: string[];
  location: string;
  workMode: 'Any' | 'Remote' | 'Hybrid' | 'On-site';
};

const CAREER_PREFERENCES_KEY = 'skillcompass.careerPreferences';

const defaultCareerPreferences: CareerPreferences = {
  domains: [],
  roles: [],
  location: '',
  workMode: 'Any',
};

const domainOptions = [
  'Software Development',
  'Data Science & Analytics',
  'AI & Machine Learning',
  'Cloud & DevOps',
];

const roleOptions = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Software Engineer',
  'Data Analyst',
  'Data Scientist',
  'AI Engineer',
  'Machine Learning Engineer',
  'DevOps Engineer',
];

const sections: Array<{
  id: SettingsSection;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Your SkillCompass account',
    icon: 'settings',
  },
  {
    id: 'github',
    label: 'GitHub',
    description: 'Connection and repositories',
    icon: 'github',
  },
  {
    id: 'career',
    label: 'Career Preferences',
    description: 'What you want to explore',
    icon: 'target',
  },
  {
    id: 'data',
    label: 'Data & Analysis',
    description: 'Your intelligence data',
    icon: 'chart',
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Sessions and sign-in',
    icon: 'settings',
  },
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  const body = await response.text();
  let payload: unknown = null;

  if (body) {
    try {
      payload = JSON.parse(body) as unknown;
    } catch {
      payload = { message: body };
    }
  }

  if (!response.ok) {
    const record = asRecord(payload);
    throw new Error(
      typeof record.message === 'string'
        ? record.message
        : `Request failed with status ${response.status}`,
    );
  }

  return payload;
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function describeUserAgent(userAgent?: string | null): string {
  const value = String(userAgent ?? '').toLowerCase();

  if (!value) return 'Active browser session';
  if (value.includes('edg')) return 'Microsoft Edge';
  if (value.includes('chrome')) return 'Google Chrome';
  if (value.includes('firefox')) return 'Mozilla Firefox';
  if (value.includes('safari')) return 'Safari';

  return 'Browser session';
}

function readCareerPreferences(): CareerPreferences {
  try {
    const stored = window.localStorage.getItem(CAREER_PREFERENCES_KEY);
    if (!stored) return defaultCareerPreferences;

    const parsed = JSON.parse(stored) as Partial<CareerPreferences>;

    return {
      domains: Array.isArray(parsed.domains) ? parsed.domains.filter(value => typeof value === 'string') : [],
      roles: Array.isArray(parsed.roles) ? parsed.roles.filter(value => typeof value === 'string') : [],
      location: typeof parsed.location === 'string' ? parsed.location : '',
      workMode:
        parsed.workMode === 'Remote' ||
        parsed.workMode === 'Hybrid' ||
        parsed.workMode === 'On-site'
          ? parsed.workMode
          : 'Any',
    };
  } catch {
    return defaultCareerPreferences;
  }
}

function saveCareerPreferences(value: CareerPreferences) {
  window.localStorage.setItem(CAREER_PREFERENCES_KEY, JSON.stringify(value));
}

function SelectionChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`sc-settings-chip ${selected ? 'selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span>{label}</span>
      {selected ? <span className="sc-settings-chip-mark">✓</span> : null}
    </button>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="sc-settings-section-intro">
      <span className="sc-settings-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sc-settings-row">
      <div className="sc-settings-row-main">
        <span className="sc-settings-row-icon">
          <SvgIcon name={icon} size={21} />
        </span>
        <div>
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
      </div>
      <div className="sc-settings-row-action">{children}</div>
    </div>
  );
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [careerPreferences, setCareerPreferences] = useState<CareerPreferences>(
    defaultCareerPreferences,
  );
  const [loading, setLoading] = useState(true);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [savingCareer, setSavingCareer] = useState(false);
  const [securityNotice, setSecurityNotice] = useState('');
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    setCareerPreferences(readCareerPreferences());

    let cancelled = false;

    const loadAccount = async () => {
      setLoading(true);
      setPageError('');

      try {
        const payload = await requestJson('/api/auth/me');
        const root = asRecord(payload);
        const data = asRecord(root.data);
        const nextUser = asRecord(data.user);

        if (!cancelled) {
          setUser({
            id: typeof nextUser.id === 'string' ? nextUser.id : undefined,
            email: typeof nextUser.email === 'string' ? nextUser.email : undefined,
            displayName:
              typeof nextUser.displayName === 'string' ? nextUser.displayName : null,
            createdAt:
              typeof nextUser.createdAt === 'string' ? nextUser.createdAt : undefined,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(
            error instanceof Error
              ? error.message
              : 'Unable to load your account details.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadSessions = async () => {
      setSecurityLoading(true);

      try {
        const payload = await requestJson('/api/auth/sessions');
        const root = asRecord(payload);
        const data = root.data;

        const rawSessions = Array.isArray(data)
          ? data
          : Array.isArray(asRecord(data).sessions)
            ? (asRecord(data).sessions as unknown[])
            : [];

        const normalized = rawSessions.flatMap(item => {
          const record = asRecord(item);
          const id = typeof record.id === 'string' ? record.id : '';

          if (!id) return [];

          return [{
            id,
            userAgent:
              typeof record.userAgent === 'string' ? record.userAgent : null,
            ipAddress:
              typeof record.ipAddress === 'string' ? record.ipAddress : null,
            createdAt:
              typeof record.createdAt === 'string' ? record.createdAt : null,
            lastUsedAt:
              typeof record.lastUsedAt === 'string' ? record.lastUsedAt : null,
            expiresAt:
              typeof record.expiresAt === 'string' ? record.expiresAt : null,
          }];
        });

        if (!cancelled) setSessions(normalized);
      } catch {
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setSecurityLoading(false);
      }
    };

    void loadAccount();
    void loadSessions();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = user?.displayName?.trim() || 'SkillCompass User';
  const email = user?.email || 'Account email unavailable';
  const initials = displayName
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const profileSubtitle = useMemo(
    () => (user?.id ? `Account ID · ${user.id.slice(0, 8)}…` : 'Your personal SkillCompass account'),
    [user?.id],
  );

  const toggleDomain = (domain: string) => {
    setCareerPreferences(current => ({
      ...current,
      domains: current.domains.includes(domain)
        ? current.domains.filter(item => item !== domain)
        : [...current.domains, domain],
    }));
  };

  const toggleRole = (role: string) => {
    setCareerPreferences(current => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter(item => item !== role)
        : [...current.roles, role],
    }));
  };

  const saveCareer = () => {
    setSavingCareer(true);
    saveCareerPreferences(careerPreferences);

    window.setTimeout(() => {
      setSavingCareer(false);
    }, 350);
  };

  const logoutAllSessions = async () => {
    setSecurityNotice('');

    try {
      await requestJson('/api/auth/logout-all', { method: 'POST' });
      setSecurityNotice('All active sessions have been signed out.');
      setSessions([]);
    } catch (error) {
      setSecurityNotice(
        error instanceof Error
          ? error.message
          : 'Unable to sign out all sessions.',
      );
    }
  };

  return (
    <main className="sc-settings-page">
      <style>{`

        .sc-settings-page,
        .sc-settings-page * {
          box-sizing: border-box;
        }

        .sc-settings-page button,
        .sc-settings-page input,
        .sc-settings-page select {
          font: inherit;
        }

        .sc-settings-page small {
          font-size: 15px !important;
        }
        .sc-settings-page {
          --sc-bg: #050d20;
          --sc-card: linear-gradient(145deg, rgba(20, 50, 96, 0.96), rgba(8, 27, 58, 0.985));
          --sc-card-soft: linear-gradient(145deg, rgba(24, 60, 112, 0.86), rgba(10, 31, 64, 0.94));
          --sc-line: rgba(112, 176, 255, 0.18);
          --sc-text: #f6f9ff;
          --sc-copy: #c6ddf5;
          --sc-copy-strong: #d9ebff;
          --sc-cyan: #62e8ff;
          --sc-blue: #63b7ff;
          --sc-purple: #c39aff;
          --sc-mint: #61e6b4;
          --sc-amber: #ffd178;
          min-height: 100%;
          padding: 34px 38px 56px;
          color: #f6f9ff;
        }

        .sc-settings-shell {
          width: min(1240px, 100%);
          margin: 0 auto;
        }

        .sc-settings-hero {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 28px;
          align-items: center;
          padding: 30px 32px;
          border-radius: 28px;
          background:
            radial-gradient(circle at 88% 8%, rgba(98, 232, 255, 0.10), transparent 30%),
            radial-gradient(circle at 18% 100%, rgba(195, 154, 255, 0.08), transparent 32%),
            linear-gradient(145deg, rgba(20, 50, 96, 0.96), rgba(8, 27, 58, 0.985));
          border: 1px solid rgba(112, 176, 255, 0.18);
          box-shadow:
            0 22px 50px rgba(0, 7, 20, 0.42),
            inset 1px 1px 0 rgba(255, 255, 255, 0.04),
            inset -1px -1px 0 rgba(0, 0, 0, 0.24);
        }

        .sc-settings-hero::before,
        .sc-settings-hero::after {
          content: "";
          position: absolute;
          border-radius: 999px;
          filter: blur(1px);
          pointer-events: none;
        }

        .sc-settings-hero::before {
          width: 170px;
          height: 170px;
          right: 90px;
          top: -92px;
          background: rgba(80, 145, 255, 0.12);
        }

        .sc-settings-hero::after {
          width: 130px;
          height: 130px;
          right: 270px;
          bottom: -86px;
          background: rgba(157, 98, 255, 0.1);
        }

        .sc-settings-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #62e8ff;
        }

        .sc-settings-hero h1 {
          margin: 0;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.04;
          letter-spacing: -0.035em;
          color: #f6f9ff;
        }

        .sc-settings-hero p {
          max-width: 700px;
          margin: 12px 0 0;
          font-size: 15px;
          line-height: 1.7;
          color: #c6ddf5;
        }

        .sc-settings-hero-orb {
          position: relative;
          z-index: 1;
          width: 112px;
          height: 112px;
          display: grid;
          place-items: center;
          border-radius: 34px;
          background: linear-gradient(145deg, rgba(24, 60, 112, 0.86), rgba(10, 31, 64, 0.94));
          border: 1px solid rgba(112, 176, 255, 0.18);
          box-shadow:
            14px 14px 28px rgba(0, 7, 20, 0.34),
            -8px -8px 18px rgba(86, 147, 220, 0.06),
            inset 0 1px 1px rgba(255,255,255,0.05);
        }

        .sc-settings-hero-orb svg {
          filter: drop-shadow(0 0 16px rgba(81, 156, 255, 0.42));
          color: #62e8ff;
        }

        .sc-settings-layout {
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr);
          gap: 22px;
          margin-top: 22px;
          align-items: start;
        }

        .sc-settings-nav,
        .sc-settings-content {
          border-radius: 24px;
          border: 1px solid rgba(112, 176, 255, 0.16);
          background: linear-gradient(145deg, rgba(20, 50, 96, 0.94), rgba(8, 27, 58, 0.985));
          box-shadow:
            0 19px 34px rgba(0, 7, 20, 0.42),
            inset 0 1px 0 rgba(255,255,255,0.025);
        }

        .sc-settings-nav {
          position: sticky;
          top: 22px;
          padding: 12px;
        }

        .sc-settings-nav-title {
          padding: 8px 12px 12px;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #8fdcff;
        }

        .sc-settings-nav-button {
          width: 100%;
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
          padding: 11px 12px;
          border: 0;
          border-radius: 16px;
          background: transparent;
          color: #b8c7e6;
          text-align: left;
          cursor: pointer;
          transition: 180ms ease;
        }

        .sc-settings-nav-button:hover {
          background: rgba(63, 132, 221, 0.10);
          color: #d9ebff;
          transform: translateX(2px);
        }

        .sc-settings-nav-button.active {
          color: #f6f9ff;
          background:
            linear-gradient(135deg, rgba(67, 139, 235, 0.20), rgba(137, 101, 243, 0.12));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.04),
            0 10px 18px rgba(0,0,0,0.14);
        }

        .sc-settings-nav-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: rgba(99, 183, 255, 0.10);
          color: #63b7ff;
        }

        .sc-settings-nav-button.active .sc-settings-nav-icon {
          color: #9ed2ff;
          background: rgba(99, 183, 255, 0.14);
        }

        .sc-settings-nav-label {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .sc-settings-nav-label strong {
          font-size: 15px;
          line-height: 1.1;
        }

        .sc-settings-nav-label span {
          font-size: 15px;
          line-height: 1.35;
          color: #9bb8d8;
        }

        .sc-settings-content {
          min-width: 0;
          padding: 28px;
        }

        .sc-settings-section-intro {
          padding-bottom: 22px;
          border-bottom: 1px solid rgba(125, 164, 220, 0.10);
        }

        .sc-settings-section-intro h2 {
          margin: 2px 0 7px;
          font-size: 26px;
          letter-spacing: -0.025em;
          color: #eff6ff;
        }

        .sc-settings-section-intro p {
          max-width: 760px;
          margin: 0;
          font-size: 15px;
          line-height: 1.7;
          color: #b8c7e6;
        }

        .sc-settings-card {
          margin-top: 18px;
          padding: 18px;
          border-radius: 20px;
          background:
            linear-gradient(145deg, rgba(29, 42, 63, 0.78), rgba(17, 26, 42, 0.94));
          border: 1px solid rgba(112, 176, 255, 0.16);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.03),
            0 14px 28px rgba(0,7,20,0.22);
        }

        .sc-settings-profile-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
        }

        .sc-settings-avatar {
          width: 62px;
          height: 62px;
          overflow: hidden;
          border-radius: 20px;
          background: linear-gradient(145deg, #29446b, #172840);
          border: 1px solid rgba(130, 179, 244, 0.18);
          box-shadow:
            8px 8px 18px rgba(0,0,0,0.22),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .sc-settings-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sc-settings-avatar-fallback {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #d8e8ff;
          font-weight: 800;
          font-size: 18px;
        }

        .sc-settings-profile-copy strong {
          display: block;
          font-size: 17px;
          color: #f1f6ff;
        }

        .sc-settings-profile-copy span {
          display: block;
          margin-top: 5px;
          font-size: 15px;
          color: #aac5e4;
        }

        .sc-settings-readonly {
          padding: 9px 12px;
          border-radius: 12px;
          background: rgba(99, 183, 255, 0.08);
          color: #9fb9d8;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .sc-settings-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }

        .sc-settings-meta {
          padding: 15px;
          border-radius: 16px;
          background: rgba(10, 18, 30, 0.32);
          border: 1px solid rgba(125, 164, 220, 0.07);
        }

        .sc-settings-meta span {
          display: block;
          margin-bottom: 5px;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8fdcff;
        }

        .sc-settings-meta strong {
          font-size: 15px;
          color: #d9ebff;
          overflow-wrap: anywhere;
        }

        .sc-settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 15px 0;
          border-bottom: 1px solid rgba(125, 164, 220, 0.08);
        }

        .sc-settings-row:first-child {
          padding-top: 0;
        }

        .sc-settings-row:last-child {
          padding-bottom: 0;
          border-bottom: 0;
        }

        .sc-settings-row-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .sc-settings-row-icon {
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: rgba(99, 183, 255, 0.10);
          color: #62dfff;
        }

        .sc-settings-row-main div {
          min-width: 0;
        }

        .sc-settings-row-main strong {
          display: block;
          font-size: 15px;
          color: #e8f3ff;
        }

        .sc-settings-row-main span {
          display: block;
          margin-top: 4px;
          font-size: 15px;
          line-height: 1.5;
          color: #a8c1df;
        }

        .sc-settings-row-action {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 8px;
        }

        .sc-settings-button {
          border: 1px solid rgba(120, 168, 232, 0.15);
          border-radius: 12px;
          padding: 9px 13px;
          background: linear-gradient(145deg, rgba(54, 82, 121, 0.48), rgba(27, 42, 63, 0.78));
          color: #dbeaff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow:
            6px 6px 14px rgba(0,0,0,0.18),
            inset 0 1px 0 rgba(255,255,255,0.035);
          transition: 180ms ease;
        }

        .sc-settings-button:hover {
          transform: translateY(-1px);
          border-color: rgba(120, 168, 232, 0.26);
          color: #ffffff;
        }

        .sc-settings-button.primary {
          background: linear-gradient(135deg, rgba(65, 135, 231, 0.52), rgba(86, 96, 190, 0.38));
        }

        .sc-settings-button.danger {
          background: linear-gradient(145deg, rgba(103, 54, 74, 0.42), rgba(48, 29, 43, 0.75));
          border-color: rgba(208, 118, 147, 0.16);
          color: #f1c4d3;
        }

        .sc-settings-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(97, 230, 180, 0.08);
          color: #a7f1d1;
          font-size: 15px;
          font-weight: 800;
        }

        .sc-settings-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #63c79b;
          box-shadow: 0 0 9px rgba(99, 199, 155, 0.65);
        }

        .sc-settings-help {
          margin-top: 14px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(70, 130, 202, 0.07);
          color: #a8c1df;
          font-size: 15px;
          line-height: 1.6;
        }

        .sc-settings-option-title {
          margin: 22px 0 10px;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9bb8d8;
        }

        .sc-settings-chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .sc-settings-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 8px 11px;
          border-radius: 12px;
          border: 1px solid rgba(112, 176, 255, 0.16);
          background: rgba(56, 79, 110, 0.10);
          color: #a9c4e0;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: 160ms ease;
        }

        .sc-settings-chip:hover {
          border-color: rgba(125, 164, 220, 0.18);
          color: #d5e8fb;
        }

        .sc-settings-chip.selected {
          border-color: rgba(89, 154, 237, 0.30);
          background: rgba(99, 183, 255, 0.15);
          color: #d9ebff;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .sc-settings-chip-mark {
          font-size: 15px;
          color: #62e8ff;
        }

        .sc-settings-field {
          margin-top: 14px;
        }

        .sc-settings-field label {
          display: block;
          margin-bottom: 7px;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #a8c4df;
        }

        .sc-settings-input,
        .sc-settings-select {
          width: 100%;
          min-height: 42px;
          border: 1px solid rgba(112, 176, 255, 0.16);
          border-radius: 13px;
          outline: none;
          background: rgba(5, 18, 40, 0.48);
          color: #e1efff;
          padding: 10px 12px;
          font: inherit;
          font-size: 15px;
          box-shadow: inset 1px 1px 0 rgba(255,255,255,0.025), inset -1px -1px 0 rgba(0,0,0,0.22);
        }

        .sc-settings-input:focus,
        .sc-settings-select:focus {
          border-color: rgba(89, 154, 237, 0.34);
          box-shadow:
            inset 0 4px 10px rgba(0,0,0,0.12),
            0 0 0 3px rgba(67, 128, 218, 0.08);
        }

        .sc-settings-workmode {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .sc-settings-workmode button {
          border: 1px solid rgba(112, 176, 255, 0.16);
          border-radius: 12px;
          min-height: 40px;
          padding: 8px;
          background: rgba(61, 103, 163, 0.12);
          color: #9fbbd8;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .sc-settings-workmode button.active {
          color: #d9ebff;
          border-color: rgba(99, 183, 255, 0.32);
          background: rgba(99, 183, 255, 0.14);
        }

        .sc-settings-session {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid rgba(125, 164, 220, 0.08);
        }

        .sc-settings-session:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .sc-settings-session:first-child {
          padding-top: 0;
        }

        .sc-settings-session-title {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 15px;
          font-weight: 800;
          color: #dce7f6;
        }

        .sc-settings-session-title span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #69cca3;
          box-shadow: 0 0 10px rgba(105, 204, 163, 0.55);
        }

        .sc-settings-session-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 5px;
          color: #82dfff;
          font-size: 15px;
        }

        .sc-settings-session-current {
          margin-left: auto;
          padding: 7px 9px;
          border-radius: 10px;
          background: rgba(99, 143, 201, 0.08);
          color: #8fb1dc;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .sc-settings-notice,
        .sc-settings-error {
          margin-top: 14px;
          padding: 12px 13px;
          border-radius: 13px;
          font-size: 15px;
          line-height: 1.5;
        }

        .sc-settings-notice {
          background: rgba(73, 144, 115, 0.09);
          color: #9ad9bb;
          border: 1px solid rgba(73, 144, 115, 0.12);
        }

        .sc-settings-error {
          background: rgba(255, 143, 159, 0.07);
          color: #ffc4d1;
          border: 1px solid rgba(255, 143, 159, 0.16);
        }

        .sc-settings-empty {
          padding: 26px 12px;
          text-align: center;
          color: #a4bddb;
          font-size: 15px;
        }

        .sc-settings-loading {
          padding: 26px 0;
          color: #a6c0dc;
          font-size: 15px;
        }

        .sc-settings-footer-note {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(125, 164, 220, 0.08);
          color: #91add0;
          font-size: 15px;
          line-height: 1.6;
        }

        @media (max-width: 980px) {
          .sc-settings-layout {
            grid-template-columns: 1fr;
          }

          .sc-settings-nav {
            position: static;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 4px;
          }

          .sc-settings-nav-title {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 720px) {
          .sc-settings-page {
            padding: 20px 16px 36px;
          }

          .sc-settings-hero {
            grid-template-columns: 1fr;
            padding: 24px;
          }

          .sc-settings-hero-orb {
            display: none;
          }

          .sc-settings-content {
            padding: 20px;
          }

          .sc-settings-nav {
            grid-template-columns: 1fr;
          }

          .sc-settings-profile-card,
          .sc-settings-meta-grid {
            grid-template-columns: 1fr;
          }

          .sc-settings-profile-card {
            display: grid;
          }

          .sc-settings-row,
          .sc-settings-session {
            grid-template-columns: 1fr;
            display: grid;
          }

          .sc-settings-row-action {
            justify-content: flex-start;
          }

          .sc-settings-workmode {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      <div className="sc-settings-shell">
        <header className="sc-settings-hero">
          <div>
            <span className="sc-settings-eyebrow">ACCOUNT CONTROL CENTER</span>
            <h1>Settings</h1>
            <p>
              Keep your SkillCompass account, GitHub connection, career direction,
              data workflow, and active sessions in one place.
            </p>
          </div>

          <div className="sc-settings-hero-orb" aria-hidden="true">
            <SvgIcon name="settings" size={42} />
          </div>
        </header>

        <div className="sc-settings-layout">
          <nav className="sc-settings-nav" aria-label="Settings sections">
            <div className="sc-settings-nav-title">Workspace settings</div>

            {sections.map(section => (
              <button
                key={section.id}
                type="button"
                className={`sc-settings-nav-button ${
                  activeSection === section.id ? 'active' : ''
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="sc-settings-nav-icon" aria-hidden="true">
                  <SvgIcon name={section.icon} size={20} />
                </span>

                <span className="sc-settings-nav-label">
                  <strong>{section.label}</strong>
                  <span>{section.description}</span>
                </span>
              </button>
            ))}
          </nav>

          <section className="sc-settings-content">
            {activeSection === 'profile' && (
              <>
                <SectionIntro
                  eyebrow="PROFILE & ACCOUNT"
                  title="Your SkillCompass identity"
                  description="This section reflects the authenticated account used across your dashboard, analysis, skills and recommendations."
                />

                {pageError ? (
                  <div className="sc-settings-error" role="alert">
                    {pageError}
                  </div>
                ) : null}

                <div className="sc-settings-card">
                  {loading ? (
                    <div className="sc-settings-loading">Loading account details…</div>
                  ) : (
                    <>
                      <div className="sc-settings-profile-card">
                        <div className="sc-settings-avatar">
                          {user ? (
                            <img src={avatarReference} alt="" />
                          ) : (
                            <div className="sc-settings-avatar-fallback">{initials}</div>
                          )}
                        </div>

                        <div className="sc-settings-profile-copy">
                          <strong>{displayName}</strong>
                          <span>{email}</span>
                          <span>{profileSubtitle}</span>
                        </div>

                        <span className="sc-settings-readonly">Account source</span>
                      </div>

                      <div className="sc-settings-meta-grid">
                        <div className="sc-settings-meta">
                          <span>Email</span>
                          <strong>{email}</strong>
                        </div>

                        <div className="sc-settings-meta">
                          <span>Member since</span>
                          <strong>{formatDate(user?.createdAt)}</strong>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="sc-settings-help">
                  Profile editing is intentionally minimal for the MVP. SkillCompass
                  derives your technical profile from your connected development
                  evidence rather than letting account settings overwrite detected
                  skills or proficiency.
                </div>
              </>
            )}

            {activeSection === 'github' && (
              <>
                <SectionIntro
                  eyebrow="GITHUB CONNECTION"
                  title="Manage your development data source"
                  description="GitHub is the primary development signal feeding repository sync, analysis, skills and current proficiency."
                />

                <div className="sc-settings-card">
                  <SettingsRow
                    icon="github"
                    title="GitHub workspace"
                    description="Connect, sync repositories, inspect the synchronized catalog, and start analysis."
                  >
                    <button
                      type="button"
                      className="sc-settings-button primary"
                      onClick={() => navigate('/github')}
                    >
                      Open GitHub
                    </button>
                  </SettingsRow>

                  <SettingsRow
                    icon="chart"
                    title="Repository analysis"
                    description="Review analysis history and open completed repository reports."
                  >
                    <button
                      type="button"
                      className="sc-settings-button"
                      onClick={() => navigate('/analysis')}
                    >
                      Open Analysis
                    </button>
                  </SettingsRow>
                </div>

                <div className="sc-settings-help">
                  GitHub sync and analysis stay separate: synchronization refreshes
                  repository data, while analysis produces the evidence that updates
                  your current cumulative skills and proficiency.
                </div>
              </>
            )}

            {activeSection === 'career' && (
              <>
                <SectionIntro
                  eyebrow="CAREER PREFERENCES"
                  title="Tell SkillCompass what you want to explore"
                  description="These preferences describe your interests. They do not replace the skills and proficiency detected from your development activity."
                />

                <div className="sc-settings-card">
                  <div className="sc-settings-option-title">Preferred domains</div>

                  <div className="sc-settings-chip-grid">
                    {domainOptions.map(domain => (
                      <SelectionChip
                        key={domain}
                        label={domain}
                        selected={careerPreferences.domains.includes(domain)}
                        onClick={() => toggleDomain(domain)}
                      />
                    ))}
                  </div>

                  <div className="sc-settings-option-title">Preferred roles</div>

                  <div className="sc-settings-chip-grid">
                    {roleOptions.map(role => (
                      <SelectionChip
                        key={role}
                        label={role}
                        selected={careerPreferences.roles.includes(role)}
                        onClick={() => toggleRole(role)}
                      />
                    ))}
                  </div>

                  <div className="sc-settings-field">
                    <label htmlFor="sc-settings-location">Preferred location</label>
                    <input
                      id="sc-settings-location"
                      className="sc-settings-input"
                      value={careerPreferences.location}
                      onChange={event =>
                        setCareerPreferences(current => ({
                          ...current,
                          location: event.target.value,
                        }))
                      }
                      placeholder="e.g. India, Bengaluru, Remote"
                    />
                  </div>

                  <div className="sc-settings-option-title">Work mode</div>

                  <div className="sc-settings-workmode">
                    {(['Any', 'Remote', 'Hybrid', 'On-site'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        className={careerPreferences.workMode === mode ? 'active' : ''}
                        onClick={() =>
                          setCareerPreferences(current => ({
                            ...current,
                            workMode: mode,
                          }))
                        }
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  <div className="sc-settings-row" style={{ marginTop: 18 }}>
                    <div className="sc-settings-row-main">
                      <span className="sc-settings-row-icon">
                        <SvgIcon name="target" size={20} />
                      </span>

                      <div>
                        <strong>Save preferences</strong>
                        <span>
                          Stored locally for the MVP so this page does not invent a
                          backend preference model that does not yet exist.
                        </span>
                      </div>
                    </div>

                    <div className="sc-settings-row-action">
                      <button
                        type="button"
                        className="sc-settings-button primary"
                        onClick={saveCareer}
                        disabled={savingCareer}
                      >
                        {savingCareer ? 'Saved' : 'Save Preferences'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sc-settings-help">
                  Current Job Profiles and Job Recommendations continue to use your
                  cumulative persisted UserSkill profile and currentScore. These
                  preferences are additional user intent, not a replacement for that
                  technical evidence.
                </div>
              </>
            )}

            {activeSection === 'data' && (
              <>
                <SectionIntro
                  eyebrow="DATA & ANALYSIS"
                  title="Understand how your intelligence data flows"
                  description="SkillCompass keeps historical analysis records while maintaining a current cumulative skill profile for recommendations."
                />

                <div className="sc-settings-card">
                  <SettingsRow
                    icon="github"
                    title="GitHub repositories"
                    description="Refresh the repository data used as input for analysis."
                  >
                    <button
                      type="button"
                      className="sc-settings-button"
                      onClick={() => navigate('/github')}
                    >
                      Manage Repositories
                    </button>
                  </SettingsRow>

                  <SettingsRow
                    icon="chart"
                    title="Analysis history"
                    description="Inspect completed, running and failed repository analysis runs."
                  >
                    <button
                      type="button"
                      className="sc-settings-button"
                      onClick={() => navigate('/analysis')}
                    >
                      View History
                    </button>
                  </SettingsRow>

                  <SettingsRow
                    icon="target"
                    title="Current skill profile"
                    description="Open the skills view that reflects your current persisted skill state."
                  >
                    <button
                      type="button"
                      className="sc-settings-button"
                      onClick={() => navigate('/skills')}
                    >
                      Open Skills
                    </button>
                  </SettingsRow>

                  <div className="sc-settings-help" style={{ marginBottom: 0 }}>
                    Analysis runs are historical provenance. Job Profiles and Job
                    Recommendations do not need an analysis identifier to operate on
                    your current cumulative skills.
                  </div>
                </div>
              </>
            )}

            {activeSection === 'security' && (
              <>
                <SectionIntro
                  eyebrow="SECURITY"
                  title="Keep your SkillCompass sessions under control"
                  description="Your authenticated sessions are managed by the SkillCompass account system."
                />

                <div className="sc-settings-card">
                  <SettingsRow
                    icon="settings"
                    title="Active sessions"
                    description={
                      securityLoading
                        ? 'Checking your current sessions…'
                        : `${sessions.length} active session${sessions.length === 1 ? '' : 's'} found`
                    }
                  >
                    <span className="sc-settings-status">
                      <span className="sc-settings-status-dot" />
                      Protected
                    </span>
                  </SettingsRow>

                  <div style={{ marginTop: 18 }}>
                    {securityLoading ? (
                      <div className="sc-settings-loading">Loading sessions…</div>
                    ) : sessions.length === 0 ? (
                      <div className="sc-settings-empty">
                        No active sessions were returned by the account service.
                      </div>
                    ) : (
                      sessions.map((session, index) => (
                        <div key={session.id} className="sc-settings-session">
                          <div>
                            <div className="sc-settings-session-title">
                              <span />
                              {describeUserAgent(session.userAgent)}
                            </div>

                            <div className="sc-settings-session-meta">
                              <span>
                                Created {formatDate(session.createdAt)}
                              </span>
                              <span>
                                Last used {formatDate(session.lastUsedAt)}
                              </span>
                              {session.ipAddress ? (
                                <span>{session.ipAddress}</span>
                              ) : null}
                            </div>
                          </div>

                          {index === 0 ? (
                            <span className="sc-settings-session-current">Current</span>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="sc-settings-row" style={{ marginTop: 18 }}>
                    <div className="sc-settings-row-main">
                      <span className="sc-settings-row-icon">
                        <SvgIcon name="settings" size={20} />
                      </span>

                      <div>
                        <strong>Sign out all sessions</strong>
                        <span>
                          Revoke every active SkillCompass session. You will need to
                          sign in again.
                        </span>
                      </div>
                    </div>

                    <div className="sc-settings-row-action">
                      <button
                        type="button"
                        className="sc-settings-button danger"
                        onClick={() => void logoutAllSessions()}
                      >
                        Sign Out All
                      </button>
                    </div>
                  </div>

                  {securityNotice ? (
                    <div className="sc-settings-notice" role="status">
                      {securityNotice}
                    </div>
                  ) : null}
                </div>

                <div className="sc-settings-footer-note">
                  Password-change controls are intentionally not shown until the
                  backend exposes a dedicated password-update endpoint. This avoids
                  presenting a UI control that cannot be persisted safely.
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
