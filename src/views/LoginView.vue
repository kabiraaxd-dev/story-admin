<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { ApiError } from '@/lib/http'

const auth = useAuth()
const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push((route.query.next as string) || '/')
  } catch (e) {
    error.value = e instanceof ApiError && e.status === 401 ? 'Wrong email or password.' : 'Could not log in.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main>
    <h1>Admin login</h1>
    <form @submit.prevent="submit">
      <label>Email <input v-model="email" type="email" required autocomplete="username" /></label>
      <label>Password <input v-model="password" type="password" required autocomplete="current-password" /></label>
      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="loading" style="margin-top: 1rem">Log in</button>
    </form>
  </main>
</template>