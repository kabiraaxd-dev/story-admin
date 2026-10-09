<script setup lang="ts">
import { ref } from 'vue'
import { uploadFile } from '@/lib/upload'

const props = defineProps<{ kind: 'image' | 'audio'; label: string }>()
const url = defineModel<string>({ default: '' })

const busy = ref(false)
const progress = ref(0)
const error = ref('')

const accept = props.kind === 'image' ? 'image/jpeg,image/png,image/webp' : '.mp3,.m4a,audio/mpeg,audio/mp4'

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
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
    input.value = ''
  }
}
</script>

<template>
  <div class="field">
    <strong>{{ label }}</strong>
    <div v-if="url" class="preview">
      <img v-if="kind === 'image'" :src="url" alt="" />
      <audio v-else :src="url" controls />
      <button type="button" @click="url = ''">Remove</button>
    </div>
    <input type="file" :accept="accept" :disabled="busy" @change="onPick" />
    <progress v-if="busy" :value="progress" max="100" />
    <p v-if="busy && progress === 100">Processing...</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.field { margin-top: 1rem; }
.preview { margin: 0.5rem 0; }
.preview img { max-width: 240px; border-radius: 8px; display: block; }
</style>