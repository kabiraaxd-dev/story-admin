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
  createdById: number | null;
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
