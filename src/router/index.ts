import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "@/stores/auth";

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
      name: "stories",
      component: () => import("../views/StoryListView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/stories/new",
      name: "story-new",
      component: () => import("../views/StoryFormView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/stories/:id/edit",
      name: "story-edit",
      component: () => import("../views/StoryFormView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuth();
  await auth.init();
  if (to.meta.requiresAuth && !auth.user)
    return { name: "login", query: { next: to.fullPath } };
  if (to.name === "login" && auth.user) return { name: "stories" };
});

export default router;
