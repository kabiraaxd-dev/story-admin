<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { ApiError, http } from "@/lib/http";
import { entityConfig, entityEndpoint, type EntityKind } from "./entityConfig";

const route = useRoute();
const router = useRouter();
const kind = route.meta.entity as EntityKind;
const config = entityConfig[kind];
const id = computed(() => (route.params.id ? Number(route.params.id) : null));
const form = reactive<Record<string, string | number>>({});
for (const field of config.fields) {
  form[field.key] = field.type === "number" ? 0 : "";
}
const error = ref("");
const loading = ref(!!id.value);
const saving = ref(false);
const slugTouched = ref(false);

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function onNameInput() {
  if ((kind === "categories" || kind === "tags") && !id.value && !slugTouched.value) {
    form.slug = slugify(String(form.name ?? ""));
  }
}

function onFieldInput(key: string) {
  if (key === "name") onNameInput();
  if (key === "slug") slugTouched.value = true;
}

onMounted(async () => {
  if (!id.value) return;

  try {
    const data = await http<Record<string, string | number>>(`${entityEndpoint(kind)}/${id.value}`);
    for (const field of config.fields) {
      const value = data[field.key];
      if (value !== undefined) form[field.key] = value;
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : `Could not load this ${config.singular}.`;
  } finally {
    loading.value = false;
  }
});

async function save() {
  error.value = "";
  if (kind === "age-groups" && Number(form.maxAge) < Number(form.minAge)) {
    error.value = "Maximum age must be greater than or equal to minimum age.";
    return;
  }
  saving.value = true;
  try {
    await http(`${entityEndpoint(kind)}${id.value ? `/${id.value}` : ""}`, {
      method: id.value ? "PATCH" : "POST",
      body: { ...form },
    });
    router.push(`/${kind}`);
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "Something went wrong.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h1>{{ id ? `Edit ${config.singular}` : `Add ${config.singular}` }}</h1>
    </div>
    <el-card shadow="never" >
      <p v-if="loading">Loading...</p>
      <el-form v-else  :model="form" @submit.prevent="save">
        <el-form-item v-for="field in config.fields" :key="field.key" :label="field.label" label-width="8rem" :prop="field.key" :rules="{ required: field.required, message: `${field.label} is required`, trigger: 'blur' }">
          
              <el-input
              v-if="field.type !== 'textarea'"
              v-model="form[field.key]"
              :type="field.type ?? 'text'"
              :required="field.required"
              :min="field.min"
              @input="onFieldInput(field.key)"
              />
              <el-input v-else
              type="textarea"
              v-model="form[field.key]"
              :rows="4"
              :required="field.required"
              />
        </el-form-item>
        
        <el-divider></el-divider>
          <el-button type="primary" :disabled="saving" @click="save">
            {{ saving ? "Saving..." : "Save" }}
          </el-button>
          <RouterLink :to="`/${kind}`" style="margin-left: 1rem;">
            <el-button>Cancel</el-button>
          </RouterLink>
        
        <p v-if="error" class="error">{{ error }}</p>
      </el-form>
    </el-card>
  </div>
</template>

