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
      path: "/users",
      name: "users",
      component: () => import("../views/UsersView.vue"),
      meta: { requiresAuth: true, anyOf: ["user:manage"] },
    },
    {
      path: "/",
      name: "dashboard",
      component: () => import("../views/DashboardView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/stories",
      name: "stories",
      component: () => import("../views/StoryListView.vue"),
      meta: { requiresAuth: true, anyOf: ["story:write", "story:review"] },
    },
    {
      path: "/stories/new",
      name: "story-new",
      component: () => import("../views/StoryFormView.vue"),
      meta: { requiresAuth: true, anyOf: ["story:write"] },
    },
    {
      path: "/stories/:id/edit",
      name: "story-edit",
      component: () => import("../views/StoryFormView.vue"),
      meta: { requiresAuth: true, anyOf: ["story:write"] },
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

// First page this user is allowed to open.
function homeFor(auth: ReturnType<typeof useAuth>) {
  if (auth.canAny('story:write', 'story:review')) return { name: 'stories' }
  if (auth.can('taxonomy:manage')) return { name: 'authors' }
  if (auth.can('user:manage')) return { name: 'users' }
  return { name: 'login' }
}

router.beforeEach(async (to) => {
  const auth = useAuth()
  await auth.init()
  if (to.meta.requiresAuth && !auth.user) return { name: 'login', query: { next: to.fullPath } }
  if (to.meta.anyOf && !auth.canAny(...to.meta.anyOf)) return homeFor(auth)
  if (to.name === 'login' && auth.user) return homeFor(auth)
})

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    anyOf?: Permission[];
  }
}

export default router;
