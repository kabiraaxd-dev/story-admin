export type Role = "ADMIN" | "CREATOR";
export type Status = "DRAFT" | "IN_REVIEW" | "PUBLISHED";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}
export interface Option {
  id: number;
  name: string;
  slug: string;
}
export interface AgeGroup {
  id: number;
  label: string;
}
export interface Author {
  id: number;
  name: string;
}

export interface StoryRow {
  id: number;
  title: string;
  slug: string;
  status: Status;
  author: { name: string };
  createdById: number | null;
  reviewNote: string | null;
  updatedAt: string;
}

export interface StoryFull {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  mainImageUrl: string | null;
  audioUrl: string | null;
  authorId: number;
  categoryId: number;
  ageGroupId: number;
  status: Status;
  tags: { id: number }[];
}

export type Role = "ADMIN" | "CREATOR" | "REVIEWER" | "TAXONOMY_MANAGER";
export type Permission =
  | "story:write"
  | "story:review"
  | "story:publish"
  | "story:delete"
  | "taxonomy:manage"
  | "user:manage";
export type Status = "DRAFT" | "IN_REVIEW" | "CHANGES_REQUESTED" | "PUBLISHED";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  CREATOR: "Writer",
  REVIEWER: "Reviewer",
  TAXONOMY_MANAGER: "Taxonomy Manager",
};

export interface User {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  active: boolean;
  createdAt: string;
  _count: { createdStories: number };
}