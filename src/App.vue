<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { ROLE_LABELS } from '@/types'
import { DataAnalysis, Document, Notebook, Menu as iconMenu, CollectionTag, DCaret, Check, Close, User } from '@element-plus/icons-vue'
import { useAuth } from '@/stores/auth'
import { el } from 'element-plus/es/locales.mjs'

const auth = useAuth()
const router = useRouter()

// Highlight the right menu item (the edit pages count as "Stories").
// const active = computed(() => (route.path === '/stories/new' ? '/stories/new' : '/'))
const isCollapse = ref(false)

const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  
  <div class="common-layout">
    <el-container v-if="auth.user" class="layout" >
      <el-aside class="sidebar" :width="isCollapse ? '64px' : '220px'">
        
        <div class="logo" style="height: 60px; display: flex; align-items: center; font-weight: bold;">
          <el-switch
          v-model="isCollapse"
          style="margin-left: 16px"
          :active-text="isCollapse ? 'Expand' : 'Collapse'"
          inline-prompt
          :active-icon="Check"
          :inactive-icon="Close"
          />
        </div>
        <el-menu
        default-active="active"
        router
        class="side-menu"
        :collapse="isCollapse"
        @open="handleOpen"
        @close="handleClose"
        >
        <el-menu-item index="/" >
          <el-icon><DataAnalysis /></el-icon>
          <template #title>Dashboard</template>
        </el-menu-item>
        
        <el-menu-item v-if="auth.canAny('story:write', 'story:review')" index="/stories" >
          <el-icon><Document /></el-icon>
          <template #title>Stories</template>
        </el-menu-item>

        <el-menu-item-group v-if="auth.can('taxonomy:manage')" title="Taxonomy">
          
          <el-menu-item index="/authors"  >
            <el-icon><Notebook /></el-icon>
            <template #title>Authors</template>
          </el-menu-item>

          <el-menu-item index="/categories" >
            <el-icon><icon-menu /></el-icon>
            <template #title>Categories</template>
          </el-menu-item>

          <el-menu-item index="/age-groups" >
            <el-icon><DCaret /></el-icon>
            <template #title>Age groups</template>
          </el-menu-item>

          <el-menu-item index="/tags" >
            <el-icon><CollectionTag /></el-icon>
            <template #title>Tags</template>
          </el-menu-item>

        </el-menu-item-group>

        <el-menu-item v-if="auth.can('user:manage')" index="/users" >
          <el-icon><User /></el-icon>
          <template #title>Users</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <RouterLink to="/" class="brand">📚 Story Admin</RouterLink>
        <div class="user">
          <span class="name">{{ auth.user.name }}</span>
          <el-tag v-for="r in auth.user.roles" :key="r" size="small" :type="r === 'ADMIN' ? 'danger' : 'info'">{{ ROLE_LABELS[r] }}</el-tag>
          <el-button size="small" @click="logout">Log out</el-button>
        </div>
      </el-header>
      <el-main>
        <RouterView :key="$route.fullPath"/>
      </el-main>
      <el-footer class="footer">
        <span>© 2024 Story App</span>
      </el-footer>
    </el-container>
  </el-container>
  <RouterView v-else />
  </div>

  <!-- Logged out: just the login page -->
</template>

<style scoped>
.layout { min-height: 100vh; }
.aside { background: var(--el-bg-color); border-right: 1px solid var(--el-border-color-light); }
.side-menu { border-right: none; height: 100vh; }

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}
.brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--el-text-color-primary);
  text-decoration: none;
  white-space: nowrap;
}
.nav { flex: 1; border-bottom: none; }
.user { display: flex; align-items: center; gap: 10px; }
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .name { display: none; }
}
</style>