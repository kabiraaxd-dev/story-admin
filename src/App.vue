<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'

const auth = useAuth()
const router = useRouter()

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header v-if="auth.user" class="bar">
    <RouterLink to="/">Stories</RouterLink>
    <RouterLink to="/stories/new">New story</RouterLink>
    <template v-if="auth.isAdmin">
      <RouterLink to="/authors">Authors</RouterLink>
      <RouterLink to="/categories">Categories</RouterLink>
      <RouterLink to="/age-groups">Age groups</RouterLink>
      <RouterLink to="/tags">Tags</RouterLink>
    </template>
    <span class="spacer" />
    <span>{{ auth.user.name }} ({{ auth.user.role }})</span>
    <button @click="logout">Log out</button>
  </header>
  <RouterView :key="$route.fullPath" />
</template>

<style>
body { font-family: system-ui, sans-serif; margin: 0; }
.bar { display: flex; gap: 1rem; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #ddd; }
.spacer { flex: 1; }
main { max-width: 900px; margin: 0 auto; padding: 1rem; }
.error { color: #b00020; }
label { display: block; margin-top: 0.75rem; font-weight: 600; }
input, select, textarea { width: 100%; padding: 0.5rem; box-sizing: border-box; }
</style>