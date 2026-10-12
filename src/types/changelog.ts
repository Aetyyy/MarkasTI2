export const CHANGELOG_TYPES = [
  "FEATURE",
  "IMPROVEMENT",
  "FIX",
  "SECURITY",
] as const;

export type ChangelogType = (typeof CHANGELOG_TYPES)[number];

export type ChangelogForClient = {
  id: string;
  version: string;
  title: string;
  summary: string;
  details: string | null;
  type: ChangelogType;
  isPublished: boolean;
  publishedAt: string | null;
  sortOrder: number;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChangelogAccess = {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};
