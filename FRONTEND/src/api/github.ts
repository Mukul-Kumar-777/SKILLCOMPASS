import type { Repository } from '../types/github';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RawApiResponse {
  success?: boolean;
  message?: string;
  error?: { code?: string; message?: string };
  data?: unknown;
  [key: string]: unknown;
}

interface RawRepository {
  id?: string;
  name?: string;
  fullName?: string;
  description?: string | null;
  language?: string | null;
  primaryLanguage?: string | null;
  isPrivate?: boolean;
  private?: boolean;
  stars?: number;
  stargazersCount?: number;
  forks?: number;
  forksCount?: number;
  contributors?: number;
  contributorsCount?: number;
  htmlUrl?: string;
  url?: string;
  pushedAt?: string | null;
  updatedAt?: string | null;
  topics?: string[];
  languages?: Record<string, number>;
  files?: number;
  commits?: number;
  analysisStatus?: string;
  status?: string;
  analyzedAt?: string | null;
}

function relativeTime(dateValue?: string | null): { label: string; hours: number } {
  if (!dateValue) return { label: 'Recently', hours: 0 };

  const timestamp = new Date(dateValue).getTime();
  if (!Number.isFinite(timestamp)) return { label: 'Recently', hours: 0 };

  const hours = Math.max(0, Math.round((Date.now() - timestamp) / 3_600_000));
  if (hours < 1) return { label: 'just now', hours: 0 };
  if (hours < 24) return { label: `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`, hours };
  const days = Math.round(hours / 24);
  if (days < 7) return { label: `${days} ${days === 1 ? 'day' : 'days'} ago`, hours };
  const weeks = Math.round(days / 7);
  if (weeks < 5) return { label: `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`, hours };
  const months = Math.round(days / 30);
  return { label: `${months} ${months === 1 ? 'month' : 'months'} ago`, hours };
}

function languageTone(language: string): string {
  const value = language.toLowerCase();
  if (value.includes('python')) return 'yellow';
  if (value.includes('kotlin')) return 'purple';
  if (value.includes('react')) return 'cyan';
  if (value.includes('javascript')) return 'yellow';
  if (value.includes('css') || value.includes('html')) return 'cyan';
  return 'blue';
}

function normalizeStatus(raw: RawRepository): Repository['status'] {
  const value = String(raw.analysisStatus ?? raw.status ?? '').toUpperCase();
  if (value.includes('RUNNING') || value.includes('QUEUED') || value.includes('ANALYZING')) return 'Analyzing';
  if (value.includes('COMPLETED') || value === 'ANALYZED') return 'Analyzed';
  return 'Not Analyzed';
}

function extractRepositories(payload: RawApiResponse): RawRepository[] {
  const candidates = [payload.data, payload.repositories, payload.items];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as RawRepository[];
    if (candidate && typeof candidate === 'object') {
      const nested = candidate as Record<string, unknown>;
      for (const key of ['repositories', 'items', 'data']) {
        if (Array.isArray(nested[key])) return nested[key] as RawRepository[];
      }
    }
  }

  return [];
}

function normalizeRepository(raw: RawRepository, index: number): Repository {
  const name = raw.name ?? raw.fullName?.split('/').pop() ?? `Repository ${index + 1}`;
  const language = raw.language ?? raw.primaryLanguage ?? 'Unknown';
  const relative = relativeTime(raw.pushedAt ?? raw.updatedAt);

  return {
    id: String(raw.id ?? raw.fullName ?? raw.name ?? `repository-${index}`),
    name,
    description: raw.description?.trim() || 'No description provided on GitHub.',
    language,
    languageTone: languageTone(language),
    stars: Number(raw.stars ?? raw.stargazersCount ?? 0),
    forks: Number(raw.forks ?? raw.forksCount ?? 0),
    contributors: Number(raw.contributors ?? raw.contributorsCount ?? 0),
    status: normalizeStatus(raw),
    visibility: raw.isPrivate ?? raw.private ? 'Private' : 'Public',
    updated: relative.label,
    updatedHours: relative.hours,
    topics: Array.isArray(raw.topics) ? raw.topics : language !== 'Unknown' ? [language] : [],
    languages: raw.languages ?? {},
    files: Number(raw.files ?? 0),
    commits: Number(raw.commits ?? 0),
    analyzedAt: raw.analyzedAt ?? undefined,
    githubUrl: raw.htmlUrl ?? raw.url ?? '',
  };
}


const GITHUB_CACHE_KEY = 'skillcompass.github.repositories.v1';
const GITHUB_CONNECTED_KEY = 'skillcompass.github.connected.v1';
const GITHUB_PENDING_CONNECT_KEY = 'skillcompass.github.pending-connect.v1';

interface CachedGithubState {
  repositories: Repository[];
  username?: string;
  lastSyncedAt?: string;
}

function readStorage(key: string): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  } catch {
    // Storage is an optimization; API data remains authoritative.
  }
}

function removeStorage(key: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

function persistGithubCache(state: CachedGithubState): void {
  writeStorage(GITHUB_CACHE_KEY, JSON.stringify(state));
  writeStorage(GITHUB_CONNECTED_KEY, '1');
  removeStorage(GITHUB_PENDING_CONNECT_KEY);
}

export function getCachedGithubRepositories(): CachedGithubState {
  const raw = readStorage(GITHUB_CACHE_KEY);
  if (!raw) return { repositories: [] };

  try {
    const parsed = JSON.parse(raw) as Partial<CachedGithubState>;
    return {
      repositories: Array.isArray(parsed.repositories) ? parsed.repositories : [],
      username: typeof parsed.username === 'string' ? parsed.username : undefined,
      lastSyncedAt: typeof parsed.lastSyncedAt === 'string' ? parsed.lastSyncedAt : undefined,
    };
  } catch {
    return { repositories: [] };
  }
}

export function formatCachedSyncTime(value?: string): string {
  if (!value) return 'Not synced';
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Not synced';

  const hours = Math.max(0, Math.round((Date.now() - timestamp) / 3_600_000));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const months = Math.round(days / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

export function isGithubConnected(): boolean {
  return readStorage(GITHUB_CONNECTED_KEY) === '1';
}

export function isGithubConnectionPending(): boolean {
  return readStorage(GITHUB_PENDING_CONNECT_KEY) === '1';
}

export function markGithubDisconnected(): void {
  writeStorage(GITHUB_CONNECTED_KEY, '0');
  removeStorage(GITHUB_PENDING_CONNECT_KEY);
}

/**
 * Persist repository metadata changes without pretending that GitHub is
 * connected. Analysis state is SkillCompass-owned data, so it must survive
 * a provider disconnect.
 */
export function updateCachedGithubRepositories(repositories: Repository[]): void {
  const cached = getCachedGithubRepositories();
  writeStorage(
    GITHUB_CACHE_KEY,
    JSON.stringify({
      repositories,
      username: cached.username,
      lastSyncedAt: cached.lastSyncedAt,
    } satisfies CachedGithubState),
  );
}

async function request(path: string, init: RequestInit = {}): Promise<RawApiResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  const text = await response.text();
  let payload: RawApiResponse = {};

  if (text) {
    try {
      payload = JSON.parse(text) as RawApiResponse;
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && path.includes('/api/github/')) {
      markGithubDisconnected();
    }

    throw new ApiError(
      payload.error?.message ?? payload.message ?? `Request failed with status ${response.status}`,
      response.status,
      payload.error?.code,
    );
  }

  return payload;
}

export async function syncGithubRepositories(): Promise<{ repositories: Repository[]; username?: string }> {
  const payload = await request('/api/github/repositories/sync', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const rawRepositories = extractRepositories(payload);
  const cached = getCachedGithubRepositories();
  const repositories = rawRepositories.map((raw, index) => {
    const normalized = normalizeRepository(raw, index);
    const previous = cached.repositories.find(repository => repository.id === normalized.id);

    // The GitHub sync endpoint is allowed to return only provider metadata.
    // Never turn an already-analyzed repository back into "Not Analyzed" just
    // because analysis state was omitted from that response.
    const hasExplicitAnalysisState =
      raw.analysisStatus != null ||
      raw.analyzedAt != null ||
      raw.status != null;

    if (!previous || hasExplicitAnalysisState) return normalized;

    return {
      ...normalized,
      status: previous.status,
      analyzedAt: previous.analyzedAt,
    };
  });
  const data = payload.data && typeof payload.data === 'object' ? payload.data as Record<string, unknown> : {};

  const username = typeof data.username === 'string'
    ? data.username
    : typeof payload.username === 'string'
      ? payload.username
      : undefined;

  persistGithubCache({
    repositories,
    username,
    lastSyncedAt: new Date().toISOString(),
  });

  return { repositories, username };
}

export function startGithubConnection(): void {
  // Remember that this navigation is an OAuth reconnect. After the callback
  // returns to the app, the GitHub Workspace performs exactly one sync.
  writeStorage(GITHUB_PENDING_CONNECT_KEY, '1');

  // Force a fresh authorization request so the browser cannot reuse a cached 302
  // containing an already-consumed OAuth state value.
  const cacheBuster = Date.now().toString();
  window.location.assign(`${API_BASE_URL}/api/github/connect?oauth=${cacheBuster}`);
}
