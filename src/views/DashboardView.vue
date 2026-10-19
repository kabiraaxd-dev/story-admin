<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  CircleCheck,
  CircleClose,
  Clock,
  Document,
  Menu as MenuIcon,
  Refresh,
  Notebook,
  CollectionTag,
  DCaret,
} from "@element-plus/icons-vue";
import { ApiError, http } from "@/lib/http";
import type { Status, StoryRow } from "@/types";

interface IdentifiedEntity {
  id: number;
}

interface HealthResponse {
  ok: boolean;
}

const counts = ref({
  authors: 0,
  categories: 0,
  stories: 0,
  ageGroups: 0,
  tags: 0,
});
const stories = ref<StoryRow[]>([]);
const loading = ref(true);
const error = ref("");
const health = ref<"checking" | "online" | "offline">("checking");
const healthError = ref("");
const responseTime = ref<number | null>(null);
const lastChecked = ref("");

const storyStatuses: { key: Status; label: string; color: string }[] = [
  { key: "PUBLISHED", label: "Published", color: "success" },
  { key: "IN_REVIEW", label: "In review", color: "warning" },
  { key: "DRAFT", label: "Drafts", color: "info" },
];

const statusCounts = computed(() =>
  storyStatuses.map((status) => ({
    ...status,
    count: stories.value.filter((story) => story.status === status.key).length,
  })),
);

const stats = computed(() => [
  { label: "Authors", value: counts.value.authors, icon: Notebook, tone: "purple" },
  { label: "Categories", value: counts.value.categories, icon: MenuIcon, tone: "blue" },
  { label: "Stories", value: counts.value.stories, icon: Document, tone: "orange" },
  { label: "Age groups", value: counts.value.ageGroups, icon: DCaret, tone: "green" },
  { label: "Tags", value: counts.value.tags, icon: CollectionTag, tone: "deeppink" },
]);

const totalStories = computed(() => stories.value.length);
const healthIcon = computed(() => (health.value === "online" ? CircleCheck : CircleClose));
const healthLabel = computed(() => {
  if (health.value === "checking") return "Checking API";
  return health.value === "online" ? "API operational" : "API unavailable";
});

async function checkHealth() {
  health.value = "checking";
  healthError.value = "";
  const startedAt = performance.now();
  try {
    const result = await http<HealthResponse>("/health");
    responseTime.value = Math.round(performance.now() - startedAt);
    health.value = result.ok ? "online" : "offline";
    if (!result.ok) healthError.value = "Health endpoint reported an unhealthy status.";
  } catch (e) {
    responseTime.value = null;
    health.value = "offline";
    healthError.value = e instanceof ApiError ? e.message : "Could not reach the health endpoint.";
  } finally {
    lastChecked.value = new Date().toLocaleTimeString();
  }
}

async function load() {
  loading.value = true;
  error.value = "";
  const [, statsResult] = await Promise.allSettled([
    checkHealth(),
    Promise.all([
      http<IdentifiedEntity[]>("/authors"),
      http<IdentifiedEntity[]>("/categories"),
      http<StoryRow[]>("/admin/stories"),
      http<IdentifiedEntity[]>("/age-groups"),
      http<IdentifiedEntity[]>("/tags"),
    ]),
  ]);

  if (statsResult.status === "fulfilled") {
    const [authors, categories, storyRows, ageGroups, tags] = statsResult.value;
    stories.value = storyRows;
    counts.value = {
      authors: authors.length,
      categories: categories.length,
      stories: storyRows.length,
      ageGroups: ageGroups.length,
      tags: tags.length,
    };
  } else {
    const e = statsResult.reason;
    error.value = e instanceof ApiError ? e.message : "Could not load dashboard statistics.";
  }
  loading.value = false;
}

onMounted(load);
</script>

<template>
  <div class="page dashboard">
    <header class="dashboard-header">
      <div>
        <p class="eyebrow">STORY ADMINISTRATION</p>
        <h1>Dashboard</h1>
        <p class="subtitle">Your story library at a glance.</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="load">Refresh data</el-button>
    </header>

    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      class="mb"
    />

    <section class="stats-grid" aria-label="Library statistics" v-loading="loading">
      <el-card v-for="stat in stats" :key="stat.label" shadow="hover" class="stat-card">
        <div class="stat-heading">
          <span class="stat-icon" :class="stat.tone">
            <el-icon><component :is="stat.icon" /></el-icon>
          </span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
        <el-statistic :value="stat.value"  :value-style="{ fontSize: '28px', color: stat.tone }"/>
        <p class="stat-caption">In your library</p>
      </el-card>
    </section>

    <section class="details-grid">
      <el-card shadow="never" class="details-card" v-loading="loading">
        <template #header>
          <div class="card-header">
            <div>
              <p class="eyebrow">CONTENT OVERVIEW</p>
              <h2>Story status</h2>
            </div>
            <el-tag effect="plain">{{ totalStories }} total</el-tag>
          </div>
        </template>
        <div v-if="totalStories" class="status-list">
          <div v-for="item in statusCounts" :key="item.key" class="status-row">
            <div class="status-label">
              <el-tag :type="item.color" size="small" effect="light">{{ item.label }}</el-tag>
              <strong>{{ item.count }}</strong>
            </div>
            <el-progress
              :percentage="Math.round((item.count / totalStories) * 100)"
              :status="item.color === 'success' ? 'success' : undefined"
              :show-text="false"
              :stroke-width="8"
            />
          </div>
        </div>
        <el-empty v-else description="No stories to summarize yet" :image-size="72" />
      </el-card>

      <el-card shadow="never" class="details-card health-card">
        <template #header>
          <div class="card-header">
            <div>
              <p class="eyebrow">SYSTEM</p>
              <h2>API health</h2>
            </div>
            <el-icon class="health-icon" :class="health">
              <component :is="healthIcon" />
            </el-icon>
          </div>
        </template>
        <div class="health-status" :class="health">
          <span class="health-indicator"></span>
          <strong>{{ healthLabel }}</strong>
        </div>
        <p v-if="healthError" class="health-error">{{ healthError }}</p>
        <div class="health-metrics">
          <div class="health-metric">
            <span>Response time</span>
            <strong>{{ responseTime === null ? "—" : `${responseTime} ms` }}</strong>
          </div>
          <div class="health-metric">
            <span>Last checked</span>
            <strong><el-icon><Clock /></el-icon>{{ lastChecked || "—" }}</strong>
          </div>
          <div class="health-metric">
            <span>Health endpoint</span>
            <strong>/health</strong>
          </div>
        </div>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  --dashboard-line: var(--el-border-color-lighter);
}

.dashboard-header,
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1,
h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.dashboard-header h1 {
  font-size: 28px;
  letter-spacing: -0.035em;
}
.dashboard-header p {
  margin: 2px 0;
}
h2 {
  font-size: 17px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.subtitle {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card,
.details-card {
  min-width: 0;
  border-color: var(--dashboard-line);
}

.stat-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 14px;
}

.stat-icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border-radius: 10px;
  font-size: 18px;
}

.purple { color: purple; background: #f0edff; }
.blue { color: #3686dc; background: #eaf4ff; }
.orange { color: orange; background: #fff3e0; }
.green { color: #23a875; background: #e7f8f0; }
.deeppink { color: deeppink; background: #fff0f3; }

.stat-label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  font-weight: 600;
}
/* .el-statistic {
  --el-statistic-content-font-size: 28px;
} */

.stat-caption {
  margin: 8px 0 0;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.details-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 20px;
  align-items: stretch;
}

.card-header .eyebrow {
  margin-bottom: 5px;
}

.status-list {
  display: grid;
  gap: 20px;
  padding: 5px 0;
}

.status-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
}

.status-label strong {
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.health-icon {
  font-size: 24px;
}

.health-icon.online { color: var(--el-color-success); }
.health-icon.offline { color: var(--el-color-danger); }
.health-icon.checking { color: var(--el-color-warning); }

.health-status {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 3px 0 8px;
  color: var(--el-text-color-primary);
  font-size: 15px;
}

.health-indicator {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--el-color-warning);
}

.health-status.online .health-indicator { background: var(--el-color-success); }
.health-status.offline .health-indicator { background: var(--el-color-danger); }

.health-error {
  margin: 0 0 12px;
  color: var(--el-color-danger);
  font-size: 12px;
}

.health-metrics {
  display: grid;
  margin-top: 16px;
  border-top: 1px solid var(--dashboard-line);
}

.health-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--dashboard-line);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.health-metric strong {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

@media (max-width: 1000px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .dashboard-header {
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
}

@media (max-width: 380px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
