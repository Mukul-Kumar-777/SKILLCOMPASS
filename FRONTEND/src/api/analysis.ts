import { ApiError } from './github';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export type AnalysisStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface AnalysisRun {
  id: string;
  repositoryId?: string;
  status: AnalysisStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  errorMessage?: string | null;
}

export interface AnalysisLanguage {
  /** Canonical name used by the new Analysis page. */
  language: string;
  /** Legacy alias used by RepositoryDetails / Skills. */
  name: string;
  bytes?: number;
  percentage?: number;
}

export interface AnalysisTechnology {
  [key: string]: any;
  id?: string;
  name: string;
  normalizedName?: string;
  evidenceType?: string | null;
  evidenceValue?: string | null;
  confidence: number;
}

export interface AnalysisEvidence {
  [key: string]: any;
  id?: string;
  name: string;
  normalizedName?: string;
  evidenceType?: string | null;
  evidenceValue?: string | null;
  reasoning?: string | null;
  /** Repository file/path where the evidence came from (legacy field). */
  path?: string;
  confidence: number;
}

export interface AnalysisSkill {
  [key: string]: any;
  id: string;
  name: string;
  normalizedName?: string;
  category?: string | null;
  description?: string | null;
  score: number;
  level?: ProficiencyLevel | string | null;
  confidence: number;
  /** Proficiency assessment returned by the analysis service, when available. */
  proficiency?: {
    score?: number;
    level?: ProficiencyLevel | string | null;
    confidence?: number;
    methodologyVersion?: string | null;
  } | null;
  evidence: AnalysisEvidence[];
  evidenceCount: number;
}

export interface AnalysisRepository {
  id?: string;
  name?: string;
  fullName?: string;
  defaultBranch?: string | null;
  description?: string | null;
}

export interface AnalysisSnapshot {
  id: string;
  repositoryId?: string;
  commitSha?: string | null;
  capturedAt?: string | null;
  repository?: AnalysisRepository;
  languages: AnalysisLanguage[];
  technologies: AnalysisTechnology[];
}

export interface AnalysisProficiency {
  [key: string]: any;
  id?: string;
  skillId?: string;
  userSkillId?: string;
  skillName: string;
  name?: string;
  score: number;
  level?: ProficiencyLevel | string | null;
  confidence: number;
  evidence: AnalysisEvidence[];
}

export interface AnalysisResult {
  analysisRun: AnalysisRun;
  /** Kept required for the existing Skills page; empty object when the API omits it. */
  repository: AnalysisRepository;
  snapshots: AnalysisSnapshot[];
  /** Legacy singular snapshot alias used by RepositoryDetails. */
  snapshot?: AnalysisSnapshot;
  languages: AnalysisLanguage[];
  technologies: AnalysisTechnology[];
  skills: AnalysisSkill[];
  proficiencies: AnalysisProficiency[];
  methodologyVersion?: string | null;
  files: RepositoryAnalysisFile[];
  commits: RepositoryAnalysisCommit[];
  activity: Record<string, any>[];
  fileCount: number;
  commitCount: number;
  skillCount: number;
}

/**
 * Backwards-compatible result contract used by existing repository/skills
 * screens. The fields are already present on AnalysisResult so both the new
 * Analysis page and older pages share one stable contract.
 */
export interface RepositoryAnalysisFile {
  [key: string]: any;
}

export interface RepositoryAnalysisCommit {
  [key: string]: any;
}

export type RepositoryAnalysisResult = AnalysisResult;

interface RawApiResponse {
  success?: boolean;
  message?: string;
  error?: { code?: string; message?: string };
  data?: unknown;
  [key: string]: unknown;
}

type PendingRead = {
  promise: Promise<RawApiResponse>;
  cachedUntil: number;
};

const pendingReads = new Map<string, PendingRead>();

let readQueue: Promise<void> = Promise.resolve();
const READ_GAP_MS = 450;
let lastReadStartedAt = 0;

function waitForReadSlot(): Promise<void> {
  const run = readQueue.then(async () => {
    const wait = Math.max(0, READ_GAP_MS - (Date.now() - lastReadStartedAt));
    if (wait) {
      await new Promise(resolve => window.setTimeout(resolve, wait));
    }
    lastReadStartedAt = Date.now();
  });

  // Keep the queue alive even when a previous request fails.
  readQueue = run.catch(() => undefined);
  return run;
}

function shouldDedupeRead(path: string, method: string): boolean {
  if (method !== 'GET') return false;
  // Status polling must remain live so a RUNNING analysis can transition to COMPLETED.
  return !path.includes('/status');
}

async function performRequest(path: string, init: RequestInit): Promise<RawApiResponse> {
  const max429Retries = 3;

  for (let attempt = 0; attempt <= max429Retries; attempt += 1) {
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

    if (response.status === 429 && attempt < max429Retries) {
      const retryAfterHeader = response.headers.get('Retry-After');
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;
      const retryDelay = Number.isFinite(retryAfterSeconds)
        ? Math.max(1000, retryAfterSeconds * 1000)
        : Math.min(8000, 1500 * (2 ** attempt));

      await new Promise(resolve => window.setTimeout(resolve, retryDelay));
      continue;
    }

    if (!response.ok) {
      throw new ApiError(
        payload.error?.message ?? payload.message ?? `Request failed with status ${response.status}`,
        response.status,
        payload.error?.code,
      );
    }

    return payload;
  }

  throw new ApiError('Analysis request could not be completed.', 503);
}

async function request(path: string, init: RequestInit = {}): Promise<RawApiResponse> {
  const method = (init.method ?? 'GET').toUpperCase();

  if (!shouldDedupeRead(path, method)) {
    // Keep analysis reads/writes from arriving as a burst. This is especially
    // important for the Analyze button because Analysis History may be polling
    // at the same time.
    await waitForReadSlot();
    return performRequest(path, init);
  }

  const cacheKey = `${method} ${path}`;
  const existing = pendingReads.get(cacheKey);
  const now = Date.now();

  if (existing && existing.cachedUntil > now) {
    return existing.promise;
  }

  const promise = (async () => {
    await waitForReadSlot();
    return performRequest(path, init);
  })();

  pendingReads.set(cacheKey, {
    promise,
    cachedUntil: now + 5_000,
  });

  try {
    return await promise;
  } catch (error) {
    // Never cache failures, especially rate-limit responses.
    pendingReads.delete(cacheKey);
    throw error;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : value == null ? fallback : String(value);
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeEvidence(value: unknown): AnalysisEvidence[] {
  return asArray(value).flatMap((item) => {
    const record = asRecord(item);
    const technology = asRecord(record.technologyEvidence);

    // Evidence has existed in both normalized DB form
    // (`technologyEvidence.technologyName`) and the compact API form
    // (`technology`). Support both forms.
    const technologyName =
      typeof record.technology === 'string' ? record.technology : undefined;

    const name = stringValue(
      record.name ??
      record.skillName ??
      record.technologyName ??
      technologyName ??
      technology.name ??
      technology.technologyName ??
      technology.normalizedName,
    );

    if (!name) return [];

    return [{
      id: stringValue(record.id) || undefined,
      name,
      normalizedName: stringValue(
        record.normalizedName ??
        record.technologyName ??
        technology.normalizedName ??
        (typeof record.technology === 'string' ? record.technology : undefined),
      ) || undefined,
      evidenceType: stringValue(record.evidenceType ?? technology.evidenceType) || null,
      evidenceValue: stringValue(record.evidenceValue ?? technology.evidenceValue) || null,
      reasoning: stringValue(record.reasoning) || null,
      path: stringValue(
        record.path ??
        record.filePath ??
        record.repositoryPath ??
        technology.path,
      ) || undefined,
      confidence: numberValue(record.confidence ?? technology.confidence),
    }];
  });
}

function normalizeTechnologies(value: unknown): AnalysisTechnology[] {
  return asArray(value).flatMap((item) => {
    const record = asRecord(item);
    const technology = asRecord(record.technologyEvidence);
    const name = stringValue(
      record.name ?? record.technologyName ?? technology.name ?? technology.technologyName ?? technology.normalizedName,
    );

    if (!name) return [];

    return [{
      id: stringValue(record.id ?? technology.id) || undefined,
      name,
      normalizedName: stringValue(record.normalizedName ?? technology.normalizedName) || undefined,
      evidenceType: stringValue(record.evidenceType ?? technology.evidenceType) || null,
      evidenceValue: stringValue(record.evidenceValue ?? technology.evidenceValue) || null,
      confidence: numberValue(record.confidence ?? technology.confidence),
    }];
  });
}

function normalizeLanguages(value: unknown): AnalysisLanguage[] {
  return asArray(value).flatMap((item) => {
    const record = asRecord(item);
    const language = stringValue(record.language ?? record.name);

    if (!language) return [];

    return [{
      language,
      name: language,
      bytes: numberValue(record.bytes),
      percentage: numberValue(record.percentage),
    }];
  });
}

function normalizeRun(value: unknown): AnalysisRun {
  const raw = asRecord(value);

  const id = stringValue(raw.id ?? raw.analysisRunId ?? raw.runId);
  if (!id) {
    throw new ApiError('The analysis API did not return an analysis run id.', 502);
  }

  return {
    id,
    repositoryId: stringValue(raw.repositoryId) || undefined,
    status: stringValue(raw.status, 'QUEUED').toUpperCase() as AnalysisStatus,
    startedAt: stringValue(raw.startedAt) || null,
    completedAt: stringValue(raw.completedAt) || null,
    createdAt: stringValue(raw.createdAt) || null,
    errorMessage: stringValue(raw.errorMessage) || null,
  };
}

function normalizeSnapshot(value: unknown): AnalysisSnapshot | null {
  const raw = asRecord(value);
  const repository = asRecord(raw.repository);

  const id = stringValue(raw.id ?? raw.snapshotId);
  if (!id) return null;

  return {
    id,
    repositoryId: stringValue(raw.repositoryId) || undefined,
    commitSha: stringValue(raw.commitSha) || null,
    capturedAt: stringValue(raw.capturedAt) || null,
    repository: Object.keys(repository).length ? {
      id: stringValue(repository.id) || undefined,
      name: stringValue(repository.name) || undefined,
      fullName: stringValue(repository.fullName) || undefined,
      defaultBranch: stringValue(repository.defaultBranch) || null,
      description: stringValue(repository.description) || null,
    } : undefined,
    languages: normalizeLanguages(raw.languages ?? raw.repositoryLanguages),
    technologies: normalizeTechnologies(raw.technologies ?? raw.technologyEvidence),
  };
}

function normalizeSkill(value: unknown, context: {
  linkedUserSkill?: Record<string, unknown>;
  linkedAssessment?: Record<string, unknown>;
  linkedEvidence?: unknown;
} = {}): AnalysisSkill | null {
  const raw = asRecord(value);
  const skill = asRecord(raw.skill);
  const embeddedUserSkill = asRecord(raw.userSkill);
  const userSkill = Object.keys(context.linkedUserSkill ?? {}).length
    ? (context.linkedUserSkill as Record<string, unknown>)
    : embeddedUserSkill;

  // A single endpoint can expose the same skill in several collections.
  // Merge them instead of trusting the first collection, because the compact
  // `skills` projection may omit category/evidence while `userSkills` has it.
  const assessment = asRecord(
    context.linkedAssessment ??
    raw.assessment ??
    raw.proficiency ??
    raw.latestAssessment ??
    userSkill.proficiency ??
    userSkill.latestAssessment,
  );

  const linkedSkill = asRecord(userSkill.skill);

  const name = stringValue(
    raw.name ??
    raw.skillName ??
    skill.name ??
    linkedSkill.name ??
    userSkill.name ??
    context.linkedAssessment?.skillName ??
    context.linkedAssessment?.name ??
    skill.normalizedName,
  );

  if (!name) return null;

  const id = stringValue(
    raw.id ??
    userSkill.id ??
    skill.id ??
    linkedSkill.id ??
    context.linkedAssessment?.skillId ??
    `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-skill`,
  );

  const evidenceCandidates = [
    raw.evidence,
    raw.skillEvidence,
    userSkill.evidence,
    linkedSkill.evidence,
    context.linkedEvidence,
    assessment.evidence,
    assessment.skillEvidence,
  ].filter(Boolean);

  const evidence = dedupeEvidence(evidenceCandidates.flatMap(normalizeEvidence));

  const score = numberValue(
    assessment.score ??
    raw.score ??
    raw.currentScore ??
    userSkill.currentScore,
  );

  const confidence = numberValue(
    assessment.confidence ??
    raw.confidence ??
    userSkill.confidence,
  );

  const level = stringValue(
    assessment.level ??
    raw.level ??
    userSkill.level,
  ) || null;

  const methodologyVersion =
    stringValue(assessment.methodologyVersion) || null;

  return {
    id,
    name,
    skillName: name,
    normalizedName:
      stringValue(
        raw.normalizedName ??
        skill.normalizedName ??
        linkedSkill.normalizedName,
      ) || undefined,
    category:
      stringValue(
        raw.category ??
        skill.category ??
        linkedSkill.category ??
        userSkill.category,
      ) || null,
    description:
      stringValue(
        raw.description ??
        skill.description ??
        linkedSkill.description ??
        userSkill.description,
      ) || null,
    score,
    level,
    confidence,
    proficiency: {
      score,
      level,
      confidence,
      methodologyVersion,
    },
    evidence,
    evidenceCount: Math.max(
      numberValue(raw.evidenceCount),
      numberValue(userSkill.evidenceCount),
      numberValue(assessment.evidenceCount),
      evidence.length,
    ),
  };
}

function dedupeEvidence(items: AnalysisEvidence[]): AnalysisEvidence[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = [
      item.id ?? '',
      item.name ?? '',
      item.evidenceType ?? '',
      item.evidenceValue ?? '',
      item.path ?? '',
    ].join('|').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildResult(payload: RawApiResponse): RepositoryAnalysisResult {
  const root = asRecord(payload.data);
  const result = asRecord(root.analysisResult ?? root.result ?? root);
  const run = normalizeRun(result.analysisRun ?? root.analysisRun ?? result);

  const snapshots = asArray(result.snapshots ?? result.repositorySnapshots ?? root.snapshots)
    .map(normalizeSnapshot)
    .filter((item): item is AnalysisSnapshot => Boolean(item));

  const repositoryRecord = asRecord(result.repository ?? root.repository);
  const repository: AnalysisRepository = Object.keys(repositoryRecord).length ? {
    id: stringValue(repositoryRecord.id) || undefined,
    name: stringValue(repositoryRecord.name) || undefined,
    fullName: stringValue(repositoryRecord.fullName) || undefined,
    defaultBranch: stringValue(repositoryRecord.defaultBranch) || null,
    description: stringValue(repositoryRecord.description) || null,
  } : snapshots[0]?.repository ?? {};

  // Do not use `skills ?? userSkills` here. Some API projections contain the
  // score in `skills` while the richer category/evidence lives in `userSkills`.
  const rawSkills = [
    ...asArray(result.userSkills),
    ...asArray(root.userSkills),
    ...asArray(result.skills),
    ...asArray(root.skills),
  ];

  const rawAssessments = [
    ...asArray(result.proficiencies),
    ...asArray(result.proficiencyAssessments),
    ...asArray(root.proficiencies),
    ...asArray(root.proficiencyAssessments),
  ];

  const rawUserSkills = [
    ...asArray(result.userSkills),
    ...asArray(root.userSkills),
  ];

  const userSkillById = new Map<string, Record<string, unknown>>();
  const userSkillBySkillId = new Map<string, Record<string, unknown>>();
  const userSkillByName = new Map<string, Record<string, unknown>>();

  for (const item of rawUserSkills) {
    const record = asRecord(item);
    const nestedSkill = asRecord(record.skill);
    const id = stringValue(record.id);
    const skillId = stringValue(record.skillId ?? nestedSkill.id);
    const name = stringValue(record.skillName ?? record.name ?? nestedSkill.name);

    if (id) userSkillById.set(id, record);
    if (skillId) userSkillBySkillId.set(skillId, record);
    if (name) userSkillByName.set(name.trim().toLowerCase(), record);
  }

  const assessmentByUserSkill = new Map<string, Record<string, unknown>>();
  const assessmentBySkillId = new Map<string, Record<string, unknown>>();
  const assessmentByName = new Map<string, Record<string, unknown>>();
  for (const item of rawAssessments) {
    const record = asRecord(item);
    const nestedUserSkill = asRecord(record.userSkill);
    const nestedSkill = asRecord(record.skill ?? nestedUserSkill.skill);
    const userSkillId = stringValue(record.userSkillId ?? nestedUserSkill.id);
    const skillId = stringValue(record.skillId ?? nestedSkill.id ?? nestedUserSkill.skillId);
    const name = stringValue(
      record.skillName ??
      record.name ??
      nestedSkill.name ??
      nestedUserSkill.skillName,
    );

    if (userSkillId) assessmentByUserSkill.set(userSkillId, record);
    if (skillId) assessmentBySkillId.set(skillId, record);
    if (name) assessmentByName.set(name.trim().toLowerCase(), record);
  }

  // Evidence may arrive separately from both the skill and assessment rows.
  const allEvidence = [
    ...asArray(result.evidence),
    ...asArray(result.skillEvidence),
    ...asArray(root.evidence),
    ...asArray(root.skillEvidence),
  ];
  const evidenceByUserSkill = new Map<string, AnalysisEvidence[]>();
  for (const item of allEvidence) {
    const record = asRecord(item);
    const userSkillId = stringValue(record.userSkillId ?? asRecord(record.userSkill).id);
    const normalized = normalizeEvidence([item]);
    if (userSkillId && normalized.length) {
      evidenceByUserSkill.set(
        userSkillId,
        dedupeEvidence([...(evidenceByUserSkill.get(userSkillId) ?? []), ...normalized]),
      );
    }
  }

  const uniqueSkills = new Map<string, AnalysisSkill>();
  for (const value of rawSkills) {
    const raw = asRecord(value);
    const nestedUserSkill = asRecord(raw.userSkill);
    const nestedSkill = asRecord(raw.skill ?? nestedUserSkill.skill);
    const userSkillId = stringValue(raw.userSkillId ?? nestedUserSkill.id ?? raw.id);
    const skillId = stringValue(raw.skillId ?? nestedSkill.id ?? nestedUserSkill.skillId);
    const name = stringValue(raw.skillName ?? raw.name ?? nestedSkill.name ?? nestedUserSkill.skillName);
    const linkedUserSkill =
      userSkillById.get(userSkillId) ??
      userSkillBySkillId.get(skillId) ??
      userSkillByName.get(name.trim().toLowerCase());
    const linkedAssessment =
      assessmentByUserSkill.get(userSkillId) ??
      assessmentBySkillId.get(skillId) ??
      assessmentByName.get(name.trim().toLowerCase()) ??
      asRecord(raw.assessment ?? raw.proficiency ?? raw.latestAssessment);
    const linkedEvidence = userSkillId ? evidenceByUserSkill.get(userSkillId) : undefined;

    const normalized = normalizeSkill(raw, {
      linkedUserSkill,
      linkedAssessment,
      linkedEvidence,
    });

    if (!normalized) continue;

    const key = (normalized.normalizedName ?? normalized.name).trim().toLowerCase();
    const previous = uniqueSkills.get(key);

    if (!previous || normalized.evidence.length > previous.evidence.length || normalized.category) {
      uniqueSkills.set(key, normalized);
    } else if (previous) {
      previous.evidence = dedupeEvidence([...previous.evidence, ...normalized.evidence]);
      previous.evidenceCount = Math.max(previous.evidenceCount, previous.evidence.length);
      previous.category = previous.category ?? normalized.category;
      previous.description = previous.description ?? normalized.description;
    }
  }

  const skills = [...uniqueSkills.values()];

  const technologies = normalizeTechnologies(
    result.technologies ??
    result.technologyEvidence ??
    root.technologies ??
    root.technologyEvidence ??
    snapshots.flatMap(snapshot => snapshot.technologies),
  );

  const languages = normalizeLanguages(
    result.languages ??
    result.repositoryLanguages ??
    root.languages ??
    root.repositoryLanguages ??
    snapshots.flatMap(snapshot => snapshot.languages),
  );

  const methodologyVersion =
    stringValue(
      result.methodologyVersion ??
      result.proficiencyMethodologyVersion ??
      rawAssessments.map(asRecord).map(item => stringValue(item.methodologyVersion)).find(Boolean),
    ) || null;

  const files = (result.files ?? result.repositoryFiles ?? root.files ?? []) as unknown[];
  const commits = (result.commits ?? result.commitHistory ?? root.commits ?? []) as unknown[];
  const activity = (result.activity ?? result.timeline ?? root.activity ?? []) as unknown[];

  const proficiencies: AnalysisProficiency[] = rawAssessments.flatMap((value) => {
    const raw = asRecord(value);
    const linkedUserSkill = asRecord(raw.userSkill);
    const linkedSkill = asRecord(raw.skill ?? linkedUserSkill.skill);

    const assessment = asRecord(
      raw.assessment ??
      raw.proficiency ??
      raw.latestAssessment ??
      raw,
    );

    const skillName = stringValue(
      raw.skillName ??
      raw.name ??
      linkedSkill.name ??
      linkedUserSkill.skillName ??
      asRecord(linkedUserSkill.skill).name,
    );

    if (!skillName) return [];

    return [{
      id: stringValue(raw.id) || undefined,
      skillId:
        stringValue(raw.skillId ?? linkedSkill.id) || undefined,
      userSkillId:
        stringValue(raw.userSkillId ?? linkedUserSkill.id) || undefined,
      skillName,
      name: skillName,
      score: numberValue(
        assessment.score ??
        raw.score ??
        raw.currentScore,
      ),
      level:
        stringValue(
          assessment.level ??
          raw.level,
        ) || null,
      confidence: numberValue(
        assessment.confidence ??
        raw.confidence,
      ),
      evidence: normalizeEvidence(
        raw.evidence ??
        raw.skillEvidence ??
        linkedUserSkill.evidence,
      ),
    }];
  });

  const normalizedProficiencies = proficiencies.length
    ? proficiencies
    : skills.map((skill) => ({
        skillId: skill.id,
        skillName: skill.name,
        name: skill.name,
        score: skill.proficiency?.score ?? skill.score,
        level: skill.proficiency?.level ?? skill.level,
        confidence:
          skill.proficiency?.confidence ?? skill.confidence,
        evidence: skill.evidence,
      }));

  const explicitFileCount = numberValue(result.fileCount ?? root.fileCount, files.length);
  const explicitCommitCount = numberValue(result.commitCount ?? root.commitCount, commits.length);
  const explicitSkillCount = numberValue(result.skillCount ?? root.skillCount, skills.length);

  return {
    analysisRun: run,
    repository,
    snapshots,
    languages,
    technologies,
    skills,
    methodologyVersion,
    files: files.filter(item => item && typeof item === 'object') as RepositoryAnalysisFile[],
    commits: commits.filter(item => item && typeof item === 'object') as RepositoryAnalysisCommit[],
    activity: activity.filter(item => item && typeof item === 'object') as Record<string, any>[],
    fileCount: explicitFileCount,
    commitCount: explicitCommitCount,
    skillCount: explicitSkillCount,
    proficiencies: normalizedProficiencies,
    snapshot: snapshots[0],
  };
}

export async function startRepositoryAnalysis(repositoryId: string): Promise<AnalysisRun> {
  const payload = await request(`/api/analysis/repositories/${encodeURIComponent(repositoryId)}/analyze`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const data = asRecord(payload.data);
  return normalizeRun(data.analysisRun ?? data);
}

export async function getAnalysisStatus(analysisRunId: string): Promise<AnalysisRun> {
  const payload = await request(`/api/analysis/runs/${encodeURIComponent(analysisRunId)}/status`);
  const data = asRecord(payload.data);
  return normalizeRun(data.analysisRun ?? data);
}

export async function getAnalysisLatestRun(): Promise<AnalysisRun> {
  const payload = await request('/api/analysis/latest');
  const data = asRecord(payload.data);
  return normalizeRun(data.analysisRun ?? data);
}

export async function getAnalysisResult(analysisRunId: string): Promise<RepositoryAnalysisResult> {
  const payload = await request(`/api/analysis/runs/${encodeURIComponent(analysisRunId)}`);
  return buildResult(payload);
}

/**
 * Existing history-page helper.
 * Kept here so the current AnalysisHistory page can continue importing it.
 */
export async function getRepositoryAnalysisRuns(repositoryId: string): Promise<AnalysisRun[]> {
  const payload = await request(`/api/analysis/repositories/${encodeURIComponent(repositoryId)}/runs`);
  const data = asRecord(payload.data);
  const runs = asArray(data.runs ?? data.analysisRuns);

  return runs.flatMap(item => {
    try {
      return [normalizeRun(item)];
    } catch {
      return [];
    }
  });
}

/**
 * Legacy helper kept for RepositoryDetails / Skills screens.
 * It resolves the most recent completed run belonging to this repository,
 * then loads the full analysis result for that run.
 */
export async function getLatestRepositoryAnalysis(
  repositoryId: string,
): Promise<RepositoryAnalysisResult> {
  const runs = await getRepositoryAnalysisRuns(repositoryId);

  const completed = runs
    .filter(run => run.status === 'COMPLETED')
    .sort((a, b) => {
      const aTime = new Date(a.completedAt ?? a.startedAt ?? a.createdAt ?? 0).getTime();
      const bTime = new Date(b.completedAt ?? b.startedAt ?? b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });

  if (!completed[0]) {
    throw new ApiError('No completed analysis found for this repository.', 404);
  }

  return getAnalysisResult(completed[0].id);
}

