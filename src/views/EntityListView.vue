<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { ApiError, http } from "@/lib/http";
import { entityConfig, entityEndpoint, type EntityKind } from "./entityConfig";
import { el } from "element-plus/es/locales.mjs";
import { Edit, Plus } from "@element-plus/icons-vue";

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
  <div class="page">
    <div class="page-head">
      <h1>{{ config.title }}</h1>
      <!-- <p><RouterLink :to="`/${kind}/new`">Add {{ config.singular }}</RouterLink></p> -->
       <el-button type="primary" size="" :icon="Plus" @click="() => $router.push(`/${kind}/new`)">Add {{ config.singular }}</el-button>
    </div>
    
    <!-- <p v-if="error" class="error">{{ error }}</p> -->
    <el-card shadow="never" class="box-card">
      <div v-if="error" class="mb">
        <el-alert :title="error" type="error" show-icon :closable="false" class="mb" />
        <el-button @click="load">Try again</el-button>
      </div>

      <p v-else-if="loading">Loading...</p>
      <p v-else-if="rows.length === 0">No {{ config.title.toLowerCase() }} yet.</p>
      <el-table v-else :data="rows" table-layout="auto" header-row-style="color: var(--el-color-primary); text-transform: capitalize;">
        <el-table-column v-for="column in config.columns" :key="column" :label="column" :prop="column" class="uppercase" />
        <el-table-column label="Actions">
          <template #default="{ row }">
            <!-- <RouterLink :to="`/${kind}/${row.id}/edit`">Edit</RouterLink> -->
            <el-button type="warning" :icon="Edit" plain size="small" @click="() => $router.push(`/${kind}/${row.id}/edit`)">Edit</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <!-- <table v-else>
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
    </table> -->
  </div>
</template>

<style scoped>
/* table { width: 100%; border-collapse: collapse; } */
/* .el-table thead .cell,
.el-table th .cell { text-transform: uppercase; } */
/* th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #eee; } */
</style>
