export type RepositoryVisibility =
  | 'Public'
  | 'Private';

export type RepositoryStatus =
  | 'Analyzed'
  | 'Not Analyzed'
  | 'Analyzing';

export type RepositoryTab =
  | 'Overview'
  | 'Languages'
  | 'Files'
  | 'Commits'
  | 'Analysis';

export interface Repository {
  id: string;

  name: string;

  description: string;

  language: string;

  languageTone: string;

  stars: number;

  forks: number;

  contributors?: number;

  status: RepositoryStatus;

  visibility: RepositoryVisibility;

  updated: string;

  updatedHours: number;

  isSelected?: boolean;

  topics: string[];

  languages: Record<
    string,
    number
  >;

  files?: number;

  commits?: number;

  analyzedAt?: string;

  githubUrl: string;
}