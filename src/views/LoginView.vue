<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuth } from '@/stores/auth'
import { ApiError } from '@/lib/http'

const auth = useAuth()
const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const form = reactive({ email: '', password: '' })
const rules: FormRules<typeof form> = {
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'That does not look like an email address', trigger: 'blur' },
  ],
  password: [{ required: true, message: 'Please enter your password', trigger: 'blur' }],
}

const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await auth.login(form.email, form.password)
    router.push((route.query.next as string) || '/')
  } catch (e) {
    error.value =
      e instanceof ApiError && e.status === 401
        ? 'Wrong email or password.'
        : 'Could not log in. Is the API running?'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <el-card class="card" shadow="hover">
      <template #header>
        <div class="title">📚 Story Admin</div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" type="email" size="large" autocomplete="username" />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            size="large"
            autocomplete="current-password"
          />
        </el-form-item>

        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="mb" />

        <el-button type="primary" native-type="submit" size="large" :loading="loading" class="full">
          Log in
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login { min-height: 100vh; display: grid; place-items: center; padding: 16px; }
.card { width: 100%; max-width: 380px; }
.title { font-size: 1.25rem; font-weight: 700; }
.full { width: 100%; }
</style>