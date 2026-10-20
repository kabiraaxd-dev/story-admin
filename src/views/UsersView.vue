<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Edit } from '@element-plus/icons-vue'
import { http, ApiError } from '@/lib/http'
import { useAuth } from '@/stores/auth'
import { ROLE_LABELS, type Role, type UserRow } from '@/types'

const auth = useAuth()
const rows = ref<UserRow[]>([])
const loading = ref(false)
const loadError = ref('')

const roleOptions = (Object.keys(ROLE_LABELS) as Role[]).map((value) => ({ value, label: ROLE_LABELS[value] }))

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    rows.value = await http<UserRow[]>('/admin/users')
  } catch (e) {
    loadError.value = e instanceof ApiError ? e.message : 'Could not load users.'
  } finally {
    loading.value = false
  }
}

// ---- dialog (create + edit share one form) ----
const dialog = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ name: '', email: '', password: '', roles: [] as Role[], active: true })

const isSelf = () => editingId.value === auth.user?.id

const rules = reactive<FormRules>({
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: 'Valid email required', trigger: 'blur' }],
  roles: [{ type: 'array', required: true, min: 1, message: 'Pick at least one role', trigger: 'change' }],
  password: [
    {
      validator: (_r, v: string, cb) => {
        if (editingId.value === null && v.length < 10) cb(new Error('At least 10 characters'))
        else if (editingId.value !== null && v && v.length < 10) cb(new Error('At least 10 characters'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
})

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', email: '', password: '', roles: ['CREATOR'], active: true })
  dialog.value = true
}

function openEdit(u: UserRow) {
  editingId.value = u.id
  Object.assign(form, { name: u.name, email: u.email, password: '', roles: [...u.roles], active: u.active })
  dialog.value = true
}

async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    if (editingId.value === null) {
      await http('/admin/users', {
        method: 'POST',
        body: { name: form.name, email: form.email, password: form.password, roles: form.roles },
      })
    } else {
      const body: Record<string, unknown> = { name: form.name }
      // Never send roles/active for yourself: the server rejects it.
      if (!isSelf()) { body.roles = form.roles; body.active = form.active }
      if (form.password) body.password = form.password
      await http(`/admin/users/${editingId.value}`, { method: 'PATCH', body })
    }
    ElMessage.success('User saved')
    dialog.value = false
    await load()
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : 'Could not save the user.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1>Users</h1>
      <el-button type="primary" :icon="Plus" @click="openCreate">New user</el-button>
    </div>

    <el-alert v-if="loadError" :title="loadError" type="error" show-icon :closable="false" class="mb" />

    <el-card shadow="never">
      <el-table :data="rows" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="Name" min-width="160" />
        <el-table-column prop="email" label="Email" min-width="220" />
        <el-table-column label="Roles" min-width="260">
          <template #default="{ row }">
            <el-tag v-for="r in row.roles" :key="r" size="small" class="role-tag"
              :type="r === 'ADMIN' ? 'danger' : 'info'">
              {{ ROLE_LABELS[r as Role] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Stories" width="90">
          <template #default="{ row }">{{ row._count.createdStories }}</template>
        </el-table-column>
        <el-table-column label="Status" width="110">
          <template #default="{ row }">
            <el-tag :type="row.active ? 'success' : 'info'" size="small">
              {{ row.active ? 'Active' : 'Inactive' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="110">
          <template #default="{ row }">
            <el-button size="small" :icon="Edit" @click="openEdit(row)">Edit</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog" :title="editingId === null ? 'New user' : 'Edit user'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="save">
        <el-form-item label="Name" prop="name"><el-input v-model="form.name" /></el-form-item>

        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" :disabled="editingId !== null" />
        </el-form-item>

        <el-form-item :label="editingId === null ? 'Password' : 'New password (leave empty to keep)'" prop="password">
          <el-input v-model="form.password" type="password" show-password autocomplete="new-password" />
        </el-form-item>

        <el-form-item label="Roles" prop="roles">
          <el-checkbox-group v-model="form.roles" :disabled="editingId !== null && isSelf()">
            <el-checkbox v-for="o in roleOptions" :key="o.value" :value="o.value" :label="o.label" border />
          </el-checkbox-group>
        </el-form-item>

        <el-form-item v-if="editingId !== null" label="Active">
          <el-switch v-model="form.active" :disabled="isSelf()" />
        </el-form-item>

        <el-alert v-if="editingId !== null && isSelf()" type="info" :closable="false" show-icon
          title="You can't change your own roles or active status." />
      </el-form>

      <template #footer>
        <el-button @click="dialog = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="save">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.role-tag { margin-right: 6px; }
</style>