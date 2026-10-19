<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import { http, ApiError } from '@/lib/http'
import { useAuth } from '@/stores/auth'
import FileField from '@/components/FileField.vue'
import type { Option, AgeGroup, Author, StoryFull, Status } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const id = computed(() => (route.params.id ? Number(route.params.id) : null))

const formRef = ref<FormInstance>()
const categories = ref<Option[]>([])
const tags = ref<Option[]>([])
const ageGroups = ref<AgeGroup[]>([])
const authors = ref<Author[]>([])

const form = reactive({
  title: '',
  slug: '',
  summary: '',
  content: '',
  mainImageUrl: '',
  audioUrl: '',
  authorId: null as number | null,
  categoryId: null as number | null,
  ageGroupId: null as number | null,
  tagIds: [] as number[],
})
const storyStatus = ref<Status | null>(null)
const selectedStatus = ref<'DRAFT' | 'IN_REVIEW'>('DRAFT')
const changingStatus = ref(false)

const statusLabel: Record<Status, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In review',
  PUBLISHED: 'Published',
}
const statusType: Record<Status, 'info' | 'warning' | 'success'> = {
  DRAFT: 'info',
  IN_REVIEW: 'warning',
  PUBLISHED: 'success',
}

const rules = reactive<FormRules<typeof form>>({
  title: [{ required: true, message: 'Give the story a title', trigger: 'blur' }],
  slug: [
    { required: true, message: 'The URL name is required', trigger: 'blur' },
    {
      pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/,
      message: 'Use lowercase letters, numbers and single hyphens, like brave-little-fox',
      trigger: 'blur',
    },
  ],
  summary: [{ required: true, message: 'Add a short summary', trigger: 'blur' }],
  content: [{ required: true, message: 'The story text is empty', trigger: 'blur' }],
  authorId: [{ required: true, message: 'Choose an author', trigger: 'change' }],
  categoryId: [{ required: true, message: 'Choose a category', trigger: 'change' }],
  ageGroupId: [{ required: true, message: 'Choose an age group', trigger: 'change' }],
})

const slugTouched = ref(false)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function onTitleInput() {
  if (!id.value && !slugTouched.value) form.slug = slugify(form.title)
}

onMounted(async () => {
  try {
    const [c, t, a, au] = await Promise.all([
      http<Option[]>('/categories'),
      http<Option[]>('/tags'),
      http<AgeGroup[]>('/age-groups'),
      http<Author[]>('/authors'),
    ])
    categories.value = c
    tags.value = t
    ageGroups.value = a
    authors.value = au

    if (id.value) {
      const s = await http<StoryFull>(`/admin/stories/${id.value}`)
      Object.assign(form, {
        title: s.title,
        slug: s.slug,
        summary: s.summary,
        content: s.content,
        mainImageUrl: s.mainImageUrl ?? '',
        audioUrl: s.audioUrl ?? '',
        authorId: s.authorId,
        categoryId: s.categoryId,
        ageGroupId: s.ageGroupId,
        tagIds: s.tags.map((x) => x.id),
      })
      storyStatus.value = s.status
      selectedStatus.value = s.status === 'IN_REVIEW' ? 'IN_REVIEW' : 'DRAFT'
      slugTouched.value = true
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Could not load the form.'
  } finally {
    loading.value = false
  }
})

async function updatePublishedStatus() {
  if (!id.value || !auth.isAdmin || storyStatus.value !== 'PUBLISHED') return

  const nextStatus = selectedStatus.value
  const label = statusLabel[nextStatus]
  try {
    await ElMessageBox.confirm(
      `This story will no longer be publicly visible. Move it to ${label.toLowerCase()}?`,
      'Unpublish story',
      {
        type: 'warning',
        confirmButtonText: `Move to ${label.toLowerCase()}`,
        cancelButtonText: 'Cancel',
      },
    )
  } catch {
    return
  }

  changingStatus.value = true
  try {
    await http(`/admin/stories/${id.value}/unpublish`, {
      method: 'POST',
      body: { status: nextStatus },
    })
    storyStatus.value = nextStatus
    ElMessage.success(`Story moved to ${label.toLowerCase()}`)
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : 'Could not update story status.')
  } finally {
    changingStatus.value = false
  }
}

async function save() {
  error.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('Please fix the highlighted fields.')
    return
  }

  saving.value = true
  const body = {
    title: form.title,
    slug: form.slug,
    summary: form.summary,
    content: form.content,
    mainImageUrl: form.mainImageUrl || null,
    audioUrl: form.audioUrl || null,
    authorId: form.authorId,
    categoryId: form.categoryId,
    ageGroupId: form.ageGroupId,
    tagIds: form.tagIds,
  }
  try {
    if (id.value) await http(`/admin/stories/${id.value}`, { method: 'PATCH', body })
    else await http('/admin/stories', { method: 'POST', body })
    ElMessage.success('Story saved')
    router.push({ name: 'stories' })
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Something went wrong.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <el-button link :icon="Back" @click="router.push('/stories')">All stories</el-button>
        <h1>{{ id ? 'Edit story' : 'New story' }}</h1>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" v-loading="loading" @submit.prevent="save">
      <el-row :gutter="20">
        <el-col :xs="24" :md="15">
          <el-card shadow="never" header="Story" class="mb">
            <el-form-item label="Title" prop="title">
              <el-input v-model="form.title" size="large" @input="onTitleInput" />
            </el-form-item>
            <el-form-item label="URL name (slug)" prop="slug">
              <el-input v-model="form.slug" @input="slugTouched = true" />
            </el-form-item>
            <el-form-item label="Summary" prop="summary">
              <el-input v-model="form.summary" maxlength="200" show-word-count />
            </el-form-item>
            <el-form-item label="Story text" prop="content">
              <el-input v-model="form.content" type="textarea" :rows="14" />
            </el-form-item>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="9">
          <el-card shadow="never" header="Details" class="mb">
            <el-form-item v-if="storyStatus" label="Status">
              <div class="status-control">
                <el-tag :type="statusType[storyStatus]">{{ statusLabel[storyStatus] }}</el-tag>
                <template v-if="auth.isAdmin && storyStatus === 'PUBLISHED'">
                  <el-select v-model="selectedStatus" aria-label="New story status">
                    <el-option label="Draft" value="DRAFT" />
                    <el-option label="In review" value="IN_REVIEW" />
                  </el-select>
                  <el-button
                    type="warning"
                    plain
                    :loading="changingStatus"
                    @click="updatePublishedStatus"
                  >
                    Unpublish
                  </el-button>
                </template>
              </div>
            </el-form-item>
            <el-form-item label="Author" prop="authorId">
              <el-select v-model="form.authorId" placeholder="Choose an author" style="width: 100%">
                <el-option v-for="a in authors" :key="a.id" :label="a.name" :value="a.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="Category" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="Choose a category" style="width: 100%">
                <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="Age group" prop="ageGroupId">
              <el-select v-model="form.ageGroupId" placeholder="Choose an age group" style="width: 100%">
                <el-option v-for="a in ageGroups" :key="a.id" :label="a.label" :value="a.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="Tags">
              <el-select v-model="form.tagIds" multiple filterable placeholder="Choose tags" style="width: 100%">
                <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
          </el-card>

          <el-card shadow="never" header="Media" class="mb">
            <el-form-item label="Main image">
              <FileField v-model="form.mainImageUrl" kind="image" />
            </el-form-item>
            <el-form-item label="Audio narration (optional)">
              <FileField v-model="form.audioUrl" kind="audio" />
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>

      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="mb" />

      <el-button type="primary" native-type="submit" size="large" :loading="saving">Save story</el-button>
      <el-button size="large" @click="router.push('/')">Cancel</el-button>
    </el-form>
  </div>
</template>

<style scoped>
.status-control {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.status-control .el-select {
  width: 140px;
}
</style>