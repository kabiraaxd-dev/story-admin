export type EntityKind = "authors" | "categories" | "age-groups" | "tags";

export interface EntityField {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
  min?: number;
}

export const entityConfig: Record<
  EntityKind,
  { title: string; singular: string; columns: string[]; fields: EntityField[] }
> = {
  authors: {
    title: "Authors",
    singular: "author",
    columns: ["name", "bio"],
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "bio", label: "Bio", type: "textarea" },
    ],
  },
  categories: {
    title: "Categories",
    singular: "category",
    columns: ["name", "slug"],
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "slug", label: "Slug", required: true },
    ],
  },
  "age-groups": {
    title: "Age groups",
    singular: "age group",
    columns: ["label", "minAge", "maxAge"],
    fields: [
      { key: "label", label: "Label", required: true },
      { key: "minAge", label: "Minimum age", type: "number", required: true, min: 0 },
      { key: "maxAge", label: "Maximum age", type: "number", required: true, min: 0 },
    ],
  },
  tags: {
    title: "Tags",
    singular: "tag",
    columns: ["name", "slug"],
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "slug", label: "Slug", required: true },
    ],
  },
};

export const entityEndpoint = (kind: EntityKind) => `/admin/${kind}`;
