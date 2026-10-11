import { ApiError } from './github';

import type {
  CuratedJobProfile,
  RoleDomain,
  RoleSkillDefinition,
  RoleRequirementType,
  UserSkillSignal,
} from './jobProfiles.catalog';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

interface RawApiResponse {
  success?: boolean;
  message?: string;
  error?: { code?: string; message?: string };
  data?: unknown;
  [key: string]: unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (
    typeof value === 'string' &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }

  return fallback;
}

async function request(
  path: string,
  init: RequestInit = {},
): Promise<RawApiResponse> {
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
    throw new ApiError(
      payload.error?.message ??
        payload.message ??
        `Request failed with status ${response.status}`,
      response.status,
      payload.error?.code,
    );
  }

  return payload;
}

function normalizeRoleSkill(
  value: unknown,
): RoleSkillDefinition | null {
  const raw = asRecord(value);
  const skill = asRecord(raw.skill);

  const name = stringValue(
    raw.name ?? skill.name,
  );

  if (!name) return null;

  const type = stringValue(
    raw.requirementType ?? raw.type,
    'important',
  ).toLowerCase();

  const normalizedType: RoleRequirementType =
    type === 'core' || type === 'required'
      ? 'core'
      : type === 'preferred'
        ? 'preferred'
        : 'important';

  const aliases = asArray(raw.aliases)
    .map(item => stringValue(item))
    .filter(Boolean);

  return {
    name,
    aliases,
    requiredLevel: numberValue(
      raw.requiredLevel ?? raw.roleLevel,
      50,
    ),
    importance: numberValue(
      raw.importance,
      normalizedType === 'core'
        ? 1
        : normalizedType === 'preferred'
          ? 0.5
          : 0.8,
    ),
    type: normalizedType,
  };
}

function normalizeBackendProfile(
  value: unknown,
): CuratedJobProfile | null {
  const raw = asRecord(value);

  const slug = stringValue(raw.slug);
  const title = stringValue(raw.title);

  if (!slug || !title) return null;

  const domain = stringValue(
    raw.domain,
    'Software Development',
  ) as RoleDomain;

  const skills = asArray(raw.skills)
    .map(normalizeRoleSkill)
    .filter(
      (item): item is RoleSkillDefinition =>
        Boolean(item),
    );

  const responsibilities = asArray(
    raw.responsibilities,
  )
    .map(item => stringValue(item))
    .filter(Boolean);

  const aliases = asArray(raw.aliases)
    .map(item => stringValue(item))
    .filter(Boolean);

  return {
    id: stringValue(raw.id, `backend-${slug}`),
    slug,
    title,
    domain,
    description: stringValue(
      raw.description,
      'Explore the responsibilities, skills and capabilities associated with this career direction.',
    ),
    responsibilities,
    aliases,
    source: 'backend',
    skills,
  };
}

function normalizeCurrentUserSkill(
  value: unknown,
): UserSkillSignal | null {
  const raw = asRecord(value);

  const name = stringValue(raw.name);

  if (!name) return null;

  const normalizedName = stringValue(
    raw.normalizedName,
  );

  const score = numberValue(
    raw.currentScore ?? raw.score,
    0,
  );

  const levelValue = raw.level;

  const level =
    typeof levelValue === 'string'
      ? levelValue
      : null;

  return {
    name,
    normalizedName: normalizedName || undefined,
    score: Math.max(
      0,
      Math.min(100, score),
    ),
    level,
  };
}

export async function getBackendJobProfiles(
  params: {
    search?: string;
    domain?: RoleDomain | 'All domains';
    limit?: number;
  } = {},
): Promise<CuratedJobProfile[]> {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set(
      'search',
      params.search.trim(),
    );
  }

  if (
    params.domain &&
    params.domain !== 'All domains'
  ) {
    query.set(
      'domain',
      params.domain,
    );
  }

  query.set(
    'limit',
    String(params.limit ?? 200),
  );

  const payload = await request(
    `/api/job-profiles?${query.toString()}`,
  );

  const data = asRecord(payload.data);

  return asArray(
    data.profiles ?? data.items,
  )
    .map(normalizeBackendProfile)
    .filter(
      (item): item is CuratedJobProfile =>
        Boolean(item),
    );
}

export async function getCurrentUserSkills(): Promise<UserSkillSignal[]> {
  const payload = await request(
    '/api/job-profiles/current-skills',
  );

  const data = asRecord(payload.data);

  return asArray(data.skills)
    .map(normalizeCurrentUserSkill)
    .filter(
      (item): item is UserSkillSignal =>
        Boolean(item),
    );
}