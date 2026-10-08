import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { http, refresh, setToken } from "@/lib/http";
import type { User } from "@/types";

export const useAuth = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const ready = ref(false);
  const isAdmin = computed(() => user.value?.role === "ADMIN");

  // Runs once on startup: restores the session from the refresh cookie.
  async function init() {
    if (ready.value) return;
    user.value = await refresh();
    ready.value = true;
  }

  async function login(email: string, password: string) {
    const data = await http<{ accessToken: string; user: User }>(
      "/auth/login",
      {
        method: "POST",
        body: { email, password },
      },
    );
    setToken(data.accessToken);
    user.value = data.user;
  }

  async function logout() {
    await http("/auth/logout", { method: "POST" }).catch(() => {});
    setToken(null);
    user.value = null;
  }

  return { user, ready, isAdmin, init, login, logout };
});
