<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { ApiError, http } from "@/lib/http";
import { entityConfig, entityEndpoint, type EntityKind } from "./entityConfig";

interface EntityRow {
  id: number;
  [key: string]: string | number | null;
}

const route = useRoute();
const kind = route.meta.entity as EntityKind;
const config = entityConfig[kind];
const rows = ref<EntityRow[]>([]);
const error = ref("");
const loading = ref(true);

onMounted(async () => {
  try {
    rows.value = await http<EntityRow[]>(entityEndpoint(kind));
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : `Could not load ${config.title.toLowerCase()}.`;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main>
    <h1>{{ config.title }}</h1>
    <p><RouterLink :to="`/${kind}/new`">Add {{ config.singular }}</RouterLink></p>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="loading">Loading...</p>
    <p v-else-if="rows.length === 0">No {{ config.title.toLowerCase() }} yet.</p>
    <table v-else>
      <thead>
        <tr>
          <th v-for="column in config.columns" :key="column">{{ column }}</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td v-for="column in config.columns" :key="column">{{ row[column] || "—" }}</td>
          <td><RouterLink :to="`/${kind}/${row.id}/edit`">Edit</RouterLink></td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #eee; }
</style>
