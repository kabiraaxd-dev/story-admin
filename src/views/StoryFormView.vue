<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http, ApiError } from '@/lib/http'
import type { Option, AgeGroup, Author, StoryFull } from '@/types'

const route = useRoute()
const router = useRouter()
const id = computed(() => (route.params.id ? Number(route.params.id) : null))

const categories = ref<Option[]>([])
const tags = ref<Option[]>([])
const ageGroups = ref<AgeGroup[]>([])
const authors = ref<Author[]>([])

const form = reactive({
  title: '', slug: '', summary: '', content: '',
  mainImageUrl: '', audioUrl: '',
  authorId: null as number | null,
  categoryId: null as number | null,
  ageGroupId: null as number | null,
  tagIds: [] as number[],
})
const slugTouched = ref(false)
const error = ref('')
const saving = ref(false)

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
    categories.value = c; tags.value = t; ageGroups.value = a; authors.value = au

    if (id.value) {
      const s = await http<StoryFull>(`/admin/stories/${id.value}`)
      Object.assign(form, {
        title: s.title, slug: s.slug, summary: s.summary, content: s.content,
        mainImageUrl: s.mainImageUrl ?? '', audioUrl: s.audioUrl ?? '',
        authorId: s.authorId, categoryId: s.categoryId, ageGroupId: s.ageGroupId,
        tagIds: s.tags.map((x) => x.id),
      })
      slugTouched.value = true
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Could not load the form.'
  }
})

async function save() {
  error.value = ''
  if (!form.authorId || !form.categoryId || !form.ageGroupId) {
    error.value = 'Please choose an author, category and age group.'
    return
  }
  saving.value = true
  const body = {
    title: form.title, slug: form.slug, summary: form.summary, content: form.content,
    mainImageUrl: form.mainImageUrl || null,
    audioUrl: form.audioUrl || null,
    authorId: form.authorId, categoryId: form.categoryId,
    ageGroupId: form.ageGroupId, tagIds: form.tagIds,
  }
  try {
    if (id.value) await http(`/admin/stories/${id.value}`, { method: 'PATCH', body })
    else await http('/admin/stories', { method: 'POST', body })
    router.push({ name: 'stories' })
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Something went wrong.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main>
    <h1>{{ id ? 'Edit story' : 'New story' }}</h1>
    <form @submit.prevent="save">
      <label>Title <input v-model="form.title" required @input="onTitleInput" /></label>
      <label>Slug (URL name) <input v-model="form.slug" required @input="slugTouched = true" /></label>
      <label>Summary <input v-model="form.summary" required /></label>
      <label>Story text <textarea v-model="form.content" rows="10" required /></label>
      <label>Main image URL <input v-model="form.mainImageUrl" type="url" placeholder="https://..." /></label>
      <label>Audio URL (optional) <input v-model="form.audioUrl" type="url" placeholder="https://..." /></label>

      <label>Author
        <select v-model="form.authorId">
          <option :value="null" disabled>Choose...</option>
          <option v-for="a in authors" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
      </label>
      <label>Category
        <select v-model="form.categoryId">
          <option :value="null" disabled>Choose...</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
      <label>Age group
        <select v-model="form.ageGroupId">
          <option :value="null" disabled>Choose...</option>
          <option v-for="a in ageGroups" :key="a.id" :value="a.id">{{ a.label }}</option>
        </select>
      </label>

      <label>Tags</label>
      <div>
        <label v-for="t in tags" :key="t.id" style="display: inline-block; margin-right: 1rem; font-weight: normal">
          <input v-model="form.tagIds" type="checkbox" :value="t.id" style="width: auto" /> {{ t.name }}
        </label>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="saving" style="margin-top: 1rem">{{ saving ? 'Saving...' : 'Save' }}</button>
    </form>
  </main>
</template>