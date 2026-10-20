<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Promotion, Check, Close, RefreshLeft } from '@element-plus/icons-vue'
import { http, ApiError } from '@/lib/http'
import { useAuth } from '@/stores/auth'
import type { Status, StoryRow } from '@/types'

const router = useRouter()
const auth = useAuth()

const rows = ref<StoryRow[]>([])
const loading = ref(true)
const loadError = ref('')

const search = ref('')
const statusFilter = ref<Status | ''>('')
const page = ref(1)
const pageSize = 10

const statusLabel: Record<Status, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In review',
  PUBLISHED: 'Published',
  CHANGES_REQUESTED: 'Changes requested',
}
const statusType: Record<Status, 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'info',
  IN_REVIEW: 'warning',
  PUBLISHED: 'success',
  CHANGES_REQUESTED: 'danger',
}

const own = (s: StoryRow) => s.createdById === auth.user?.id

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter(
    (s) =>
      (!statusFilter.value || s.status === statusFilter.value) &&
      (!q || s.title.toLowerCase().includes(q)),
  )
})
const visible = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch([search, statusFilter], () => { page.value = 1 })

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    rows.value = await http<StoryRow[]>('/admin/stories')
  } catch (e) {
    loadError.value = e instanceof ApiError ? e.message : 'Could not load stories.'
  } finally {
    loading.value = false
  }
}

// Run an action, show a toast, then refresh the table.
async function act(action: () => Promise<unknown>, successMessage: string) {
  try {
    await action()
    ElMessage.success(successMessage)
    await load()
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : 'Something went wrong.')
  }
}

const canEdit = (s: StoryRow) =>
  auth.hasRole('ADMIN') ||
  (auth.can('story:write') && own(s) && (s.status === 'DRAFT' || s.status === 'CHANGES_REQUESTED'))

const canSubmit = (s: StoryRow) =>
  canEdit(s) && (s.status === 'DRAFT' || s.status === 'CHANGES_REQUESTED')

// Reviewing your own story is blocked for everyone except Admin.
const canReviewThis = (s: StoryRow) =>
  s.status === 'IN_REVIEW' && (!own(s) || auth.hasRole('ADMIN'))

const canApprove = (s: StoryRow) => auth.can('story:publish') && canReviewThis(s)
const canRequestChanges = (s: StoryRow) => auth.can('story:review') && canReviewThis(s)
const canUnpublish = (s: StoryRow) => auth.can('story:publish') && s.status === 'PUBLISHED'
const unpublish = (s: StoryRow) =>
  act(() => http(`/admin/stories/${s.id}/unpublish`, { method: 'POST' }), 'Story unpublished')

async function requestChanges(s: StoryRow) {
  let note: string
  try {
    const res = await ElMessageBox.prompt(`What should the writer change in "${s.title}"?`, 'Request changes', {
      confirmButtonText: 'Send',
      cancelButtonText: 'Cancel',
      inputPlaceholder: 'Explain what needs to change',
      inputValidator: (v: string) => v.trim().length >= 3 || 'Please write at least 3 characters',
    })
    note = res.value
  } catch {
    return // cancelled
  }
  await act(
    () => http(`/admin/stories/${s.id}/request-changes`, { method: 'POST', body: { note: note.trim() } }),
    'Changes requested',
  )
}

const submitForReview = (s: StoryRow) =>
  act(() => http(`/admin/stories/${s.id}/submit`, { method: 'POST' }), 'Submitted for review')

const publish = (s: StoryRow) =>
  act(() => http(`/admin/stories/${s.id}/publish`, { method: 'POST' }), 'Story published')

async function remove(s: StoryRow) {
  try {
    await ElMessageBox.confirm(`Delete "${s.title}"? This cannot be undone.`, 'Delete story', {
      type: 'warning',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonClass: 'el-button--danger',
    })
  } catch {
    return // the user cancelled
  }
  await act(() => http(`/admin/stories/${s.id}`, { method: 'DELETE' }), 'Story deleted')
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1>{{ auth.can('story:review') ? 'All stories' : 'My stories' }}</h1>
      <el-button v-if="auth.can('story:write')" type="primary" :icon="Plus" @click="router.push('/stories/new')">
        New story
      </el-button>
    </div>

    <div v-if="loadError" class="mb">
      <el-alert :title="loadError" type="error" show-icon :closable="false" class="mb" />
      <el-button @click="load">Try again</el-button>
    </div>

    <el-card shadow="never">
      <div class="toolbar">
        <el-input v-model="search" placeholder="Search by title" clearable class="search" />
        <el-select v-model="statusFilter" placeholder="All statuses" clearable class="status">
          <el-option v-for="(label, value) in statusLabel" :key="value" :label="label" :value="value" />
        </el-select>
      </div>

      <el-table :data="visible" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="title" label="Title" min-width="220" />

        <el-table-column label="Author" width="140">
          <template #default="{ row }">{{ row.createdBy?.name ?? '-' }}</template>
        </el-table-column>

        <el-table-column label="Status" width="190">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusLabel[row.status] }}</el-tag>
            <el-tooltip v-if="row.status === 'CHANGES_REQUESTED' && row.reviewNote" :content="row.reviewNote" placement="top">
              <el-link type="danger" class="note-link">See note</el-link>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="Updated" width="130">
          <template #default="{ row }">{{ new Date(row.updatedAt).toLocaleDateString() }}</template>
        </el-table-column>

        <el-table-column label="Actions" width="360">
          <template #default="{ row }">
            <el-button v-if="canEdit(row)" size="small" :icon="Edit" @click="router.push(`/stories/${row.id}/edit`)">
              Edit
            </el-button>
            <el-button v-if="canSubmit(row)" size="small" :icon="Promotion" @click="submitForReview(row)">
              Submit
            </el-button>
            <el-button v-if="canApprove(row)" size="small" type="success" :icon="Check" @click="publish(row)">
              Publish
            </el-button>
            <el-button v-if="canRequestChanges(row)" size="small" type="warning" :icon="Close" @click="requestChanges(row)">
              Request changes
            </el-button>
            <el-button v-if="canUnpublish(row)" size="small" :icon="RefreshLeft" @click="unpublish(row)">
              Unpublish
            </el-button>
            <el-button v-if="auth.can('story:delete')" size="small" type="danger" plain :icon="Delete" @click="remove(row)">
              Delete
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty
            v-if="!loading"
            :description="rows.length ? 'No stories match your filters' : 'No stories yet'"
          >
            <el-button v-if="!rows.length" type="primary" @click="router.push('/stories/new')">
              Write the first one
            </el-button>
          </el-empty>
        </template>
      </el-table>

      <div v-if="filtered.length > pageSize" class="pager">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="filtered.length"
          layout="prev, pager, next"
          background
        />
      </div>
    </el-card>
    <el-alert
      v-if="story?.status === 'CHANGES_REQUESTED' && story.reviewNote"
      title="Changes requested"
      :description="story.reviewNote"
      type="warning"
      show-icon
      :closable="false"
      class="mb"
    />
  </div>
</template>

<style scoped>
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.search { max-width: 320px; }
.status { width: 180px; }
.pager { display: flex; justify-content: flex-end; margin-top: 16px; }
.note-link { margin-left: 8px; font-size: 12px; }
</style>