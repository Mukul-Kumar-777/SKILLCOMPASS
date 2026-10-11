const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export interface RecommendedJobSkillGap {
  id: string;
  skillId: string;
  skillName: string;
  currentScore: number;
  requiredImportance: number;
  gapScore: number;
  priority: number;
}

export interface RecommendedJobSummary {
  id: string;
  source: string;
  externalJobId: string;
  title: string;
  companyName: string;
  location: string | null;
  employmentType: string | null;
  remote: boolean;
  url: string;
  description: string | null;
  postedAt: string | null;
  expiresAt: string | null;
}

export interface RecommendedJobSkill {
  skillId: string;
  name: string;
  normalizedName: string;
  category: string | null;
  requirementType: "REQUIRED" | "PREFERRED";
  importance: number;
}

export interface RecommendedJob {
  jobId: string;
  matchScore: number;
  skillCoverage: number;
  skillGapCount: number;
  explanation: string;
  gaps: RecommendedJobSkillGap[];
  job: RecommendedJobSummary | null;
}

export interface RecommendedJobProfile {
  id: string;
  slug: string;
  title: string;
  domain: string;
}

export interface RecommendedJobsResponse {
  jobProfile: RecommendedJobProfile;
  jobsEvaluated: number;
  matchesGenerated: number;
  recommendations: RecommendedJob[];
}

export interface JobRecommendationDetail {
  job: RecommendedJobSummary;
  skills: RecommendedJobSkill[];
  match: {
    matchScore: number;
    skillCoverage: number;
    skillGapCount: number;
    explanation: string;
    algorithmVersion: string;
  } | null;
  gaps: RecommendedJobSkillGap[];
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  message?: string;
  errors?: unknown;
}

export class JobRecommendationsApiError extends Error {
  status: number;
  details?: unknown;

  constructor(
    status: number,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "JobRecommendationsApiError";
    this.status = status;
    this.details = details;
  }
}

const readJson = async <T>(
  response: Response,
): Promise<T | null> => {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const request = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init?.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...(init?.headers ?? {}),
      },
    },
  );

  const payload = await readJson<
    ApiSuccess<T> | ApiFailure
  >(response);

  if (!response.ok) {
    const message =
      payload &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `Request failed with status ${response.status}`;

    throw new JobRecommendationsApiError(
      response.status,
      message,
      payload && "errors" in payload
        ? payload.errors
        : undefined,
    );
  }

  if (!payload || payload.success !== true) {
    throw new JobRecommendationsApiError(
      response.status,
      "The server returned an invalid recommendation response.",
      payload,
    );
  }

  return payload.data;
};

const assertJobProfileSelector = (params: {
  jobProfileId?: string;
  jobProfileSlug?: string;
}) => {
  const jobProfileId = params.jobProfileId?.trim();
  const jobProfileSlug = params.jobProfileSlug?.trim();

  if (Boolean(jobProfileId) === Boolean(jobProfileSlug)) {
    throw new Error(
      "Exactly one of jobProfileId or jobProfileSlug is required.",
    );
  }

  return {
    jobProfileId,
    jobProfileSlug,
  };
};

const assertMinScore = (
  minScore: number | undefined,
): number | undefined => {
  if (minScore === undefined) {
    return undefined;
  }

  if (
    !Number.isFinite(minScore) ||
    minScore < 0 ||
    minScore > 100
  ) {
    throw new Error(
      "minScore must be a number between 0 and 100.",
    );
  }

  return minScore;
};

export const getJobRecommendations = async (params: {
  jobProfileId?: string;
  jobProfileSlug?: string;
  minScore?: number;
}): Promise<RecommendedJobsResponse> => {
  const {
    jobProfileId,
    jobProfileSlug,
  } = assertJobProfileSelector(params);

  const minScore = assertMinScore(
    params.minScore,
  );

  const query = new URLSearchParams();

  if (jobProfileId) {
    query.set(
      "jobProfileId",
      jobProfileId,
    );
  }

  if (jobProfileSlug) {
    query.set(
      "jobProfileSlug",
      jobProfileSlug,
    );
  }

  if (minScore !== undefined) {
    query.set(
      "minScore",
      String(minScore),
    );
  }

  const queryString = query.toString();

  return request<RecommendedJobsResponse>(
    `/api/jobs/recommended${
      queryString ? `?${queryString}` : ""
    }`,
  );
};

export const generateJobRecommendations = async (params: {
  jobProfileId?: string;
  jobProfileSlug?: string;
  minScore?: number;
}): Promise<RecommendedJobsResponse> => {
  const {
    jobProfileId,
    jobProfileSlug,
  } = assertJobProfileSelector(params);

  const minScore = assertMinScore(
    params.minScore,
  );

  return request<RecommendedJobsResponse>(
    "/api/jobs/recommended/generate",
    {
      method: "POST",
      body: JSON.stringify({
        ...(jobProfileId
          ? { jobProfileId }
          : {}),
        ...(jobProfileSlug
          ? { jobProfileSlug }
          : {}),
        ...(minScore !== undefined
          ? { minScore }
          : {}),
      }),
    },
  );
};

export const getJobRecommendationDetail = async (
  jobId: string,
): Promise<JobRecommendationDetail> => {
  const normalizedJobId = jobId.trim();

  if (!normalizedJobId) {
    throw new Error("A job ID is required.");
  }

  return request<JobRecommendationDetail>(
    `/api/jobs/${encodeURIComponent(
      normalizedJobId,
    )}`,
  );
};
