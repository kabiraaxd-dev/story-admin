import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "@/stores/auth";
import type { Permission } from "@/types";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/",
      name: "dashboard",
      component: () => import("../views/DashboardView.vue"),
       meta: { requiresAuth: true, anyOf: ['taxonomy:manage'] },
    },
    {
      path: "/stories",
      name: "stories",
      component: () => import("../views/StoryListView.vue"),
       meta: { requiresAuth: true, anyOf: ['taxonomy:manage'] },
    },
    {
      path: "/stories/new",
      name: "story-new",
      component: () => import("../views/StoryFormView.vue"),
       meta: { requiresAuth: true, anyOf: ['taxonomy:manage'] },
    },
    {
      path: "/stories/:id/edit",
      name: "story-edit",
      component: () => import("../views/StoryFormView.vue"),
       meta: { requiresAuth: true, anyOf: ['taxonomy:manage'] },
    },
    ...[
      { path: "authors", name: "authors", entity: "authors" },
      { path: "categories", name: "categories", entity: "categories" },
      { path: "age-groups", name: "age-groups", entity: "age-groups" },
      { path: "tags", name: "tags", entity: "tags" },
    ].flatMap(({ path, name, entity }) => [
      {
        path: `/${path}`,
        name,
        component: () => import("../views/EntityListView.vue"),
        meta: { requiresAuth: true, requiresAdmin: true, entity },
      },
      {
        path: `/${path}/new`,
        name: `${name}-new`,
        component: () => import("../views/EntityFormView.vue"),
        meta: { requiresAuth: true, requiresAdmin: true, entity },
      },
      {
        path: `/${path}/:id/edit`,
        name: `${name}-edit`,
        component: () => import("../views/EntityFormView.vue"),
        meta: { requiresAuth: true, requiresAdmin: true, entity },
      },
    ]),
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuth();
  await auth.init();
  if (to.meta.requiresAuth && !auth.user)
    return { name: "login", query: { next: to.fullPath } };
  if (to.meta.requiresAdmin && !auth.hasRole("ADMIN")) return { name: "stories" };
  if (to.name === "login" && auth.user) return { name: "stories" };
});

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    anyOf?: Permission[];
  }
}

export default router;
