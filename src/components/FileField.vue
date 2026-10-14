<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from '@element-plus/icons-vue'
import { uploadFile } from '@/lib/upload'

const props = defineProps<{ kind: 'image' | 'audio' }>()
const url = defineModel<string>({ default: '' })

const input = ref<HTMLInputElement>()
const busy = ref(false)
const progress = ref(0)
const error = ref('')

const accept = props.kind === 'image' ? 'image/jpeg,image/png,image/webp' : '.mp3,.m4a,audio/mpeg,audio/mp4'
const hint = props.kind === 'image' ? 'JPEG, PNG or WebP, up to 5 MB' : 'MP3 or M4A, up to 20 MB'

async function onPick(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files?.[0]
  if (!file) return
  error.value = ''
  busy.value = true
  progress.value = 0
  try {
    url.value = await uploadFile(props.kind, file, (p) => (progress.value = p))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Upload failed'
  } finally {
    busy.value = false
    el.value = ''
  }
}
</script>

<template>
  <div class="file-field">
    <div v-if="url" class="preview">
      <el-image v-if="kind === 'image'" :src="url" fit="cover" class="thumb" />
      <audio v-else :src="url" controls class="audio" />
    </div>

    <div class="actions">
      <el-button :icon="Upload" :loading="busy" @click="input?.click()">
        {{ url ? 'Replace' : 'Choose file' }}
      </el-button>
      <el-button v-if="url && !busy" link type="danger" @click="url = ''">Remove</el-button>
    </div>
    <div class="hint">{{ hint }}</div>

    <input ref="input" type="file" :accept="accept" hidden @change="onPick" />

    <el-progress v-if="busy" :percentage="progress" class="progress" />
    <div v-if="busy && progress === 100" class="hint">Processing…</div>
    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="progress" />
  </div>
</template>

<style scoped>
.file-field { width: 100%; }
.preview { margin-bottom: 8px; }
.thumb { width: 100%; max-height: 200px; border-radius: 6px; }
.audio { width: 100%; }
.actions { display: flex; align-items: center; gap: 8px; }
.hint { margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary); }
.progress { margin-top: 8px; }
</style>