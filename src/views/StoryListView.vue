<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { http, ApiError } from '@/lib/http'
import { useAuth } from '@/stores/auth'
import type { StoryRow } from '@/types'

const auth = useAuth()
const rows = ref<StoryRow[]>([])
const error = ref('')

async function load() {
  rows.value = await http<StoryRow[]>('/admin/stories')
}

async function run(action: () => Promise<unknown>) {
  error.value = ''
  try {
    await action()
    await load()
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Something went wrong.'
  }
}

const canEdit = (s: StoryRow) =>
  auth.isAdmin || (s.createdById === auth.user?.id && s.status !== 'PUBLISHED')

const submit = (id: number) => run(() => http(`/admin/stories/${id}/submit`, { method: 'POST' }))
const publish = (id: number) => run(() => http(`/admin/stories/${id}/publish`, { method: 'POST' }))
const remove = (id: number) => {
  if (confirm('Delete this story permanently?')) run(() => http(`/admin/stories/${id}`, { method: 'DELETE' }))
}

onMounted(() => run(async () => {}))
</script>

<template>
  <main>
    <h1>{{ auth.isAdmin ? 'All stories' : 'My stories' }}</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="rows.length === 0">No stories yet.</p>

    <table v-else>
      <thead><tr><th>Title</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
      <tbody>
        <tr v-for="s in rows" :key="s.id">
          <td>{{ s.title }}</td>
          <td>{{ s.status }}</td>
          <td>{{ new Date(s.updatedAt).toLocaleDateString() }}</td>
          <td>
            <RouterLink v-if="canEdit(s)" :to="`/stories/${s.id}/edit`">Edit</RouterLink>
            <button v-if="canEdit(s) && s.status === 'DRAFT'" @click="submit(s.id)">Submit for review</button>
            <button v-if="auth.isAdmin && s.status !== 'PUBLISHED'" @click="publish(s.id)">Publish</button>
            <button v-if="auth.isAdmin" @click="remove(s.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #eee; }
td button, td a { margin-right: 0.5rem; }
</style>