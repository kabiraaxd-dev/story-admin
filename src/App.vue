<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
// import { ElContainer, ElAside, ElHeader, ElMain, ElFooter, ElMenu, ElMenuItem, ElIcon, ElButton, ElTag } from 'element-plus'
import { DataAnalysis, Document, Notebook, Menu as iconMenu, CollectionTag, DCaret } from '@element-plus/icons-vue'
import { useAuth } from '@/stores/auth'
import { el } from 'element-plus/es/locales.mjs'

const auth = useAuth()
const router = useRouter()

// Highlight the right menu item (the edit pages count as "Stories").
const active = computed(() => (route.path === '/stories/new' ? '/stories/new' : '/'))
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
  <!-- <header v-if="auth.user" class="bar">
    <RouterLink to="/">Stories</RouterLink>
    <RouterLink to="/stories/new">New story</RouterLink>
    <template v-if="auth.isAdmin">
      <RouterLink to="/authors">Authors</RouterLink>
      <RouterLink to="/categories">Categories</RouterLink>
      <RouterLink to="/age-groups">Age groups</RouterLink>
      <RouterLink to="/tags">Tags</RouterLink>
    </template>
    <span class="spacer" />
    <span>{{ auth.user.name }} ({{ auth.user.role }})</span>
    <button @click="logout">Log out</button>
  </header>
  <RouterView :key="$route.fullPath" /> -->
  <div class="common-layout">
    <el-container v-if="auth.user" class="layout" >
      <el-aside class="sidebar" :width="isCollapse ? '64px' : '220px'">
        <el-radio-group v-model="isCollapse" style="margin-bottom: 20px">
          <el-radio-button :value="false">expand</el-radio-button>
          <el-radio-button :value="true">collapse</el-radio-button>
        </el-radio-group>
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
        <el-menu-item index="/authors" v-if="auth.isAdmin" >
          <el-icon><Notebook /></el-icon>
          <template #title>Authors</template>
        </el-menu-item>
        <el-menu-item index="/categories" v-if="auth.isAdmin">
          <el-icon><icon-menu /></el-icon>
          <template #title>Categories</template>
        </el-menu-item>
        <el-menu-item index="/stories" >
          <el-icon><Document /></el-icon>
          <template #title>Stories</template>
        </el-menu-item>
        <el-menu-item index="/age-groups" v-if="auth.isAdmin">
          <el-icon><DCaret /></el-icon>
          <template #title>Age groups</template>
        </el-menu-item>
        <el-menu-item index="/tags" v-if="auth.isAdmin">
          <el-icon><CollectionTag /></el-icon>
          <template #title>Tags</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <RouterLink to="/" class="brand">📚 Story Admin</RouterLink>
  
        <!-- <el-menu mode="horizontal" :ellipsis="false" :default-active="active" router class="nav">
          <el-menu-item index="/">Stories</el-menu-item>
          <el-menu-item index="/stories/new">New story</el-menu-item>
          <el-menu-item index="/authors" v-if="auth.isAdmin">Authors</el-menu-item>
          <el-menu-item index="/categories" v-if="auth.isAdmin">Categories</el-menu-item>
          <el-menu-item index="/age-groups" v-if="auth.isAdmin">Age groups</el-menu-item>
          <el-menu-item index="/tags" v-if="auth.isAdmin">Tags</el-menu-item>
        </el-menu> -->
  
        
        <div class="user">
          <span class="name">{{ auth.user.name }}</span>
          <el-tag size="small" :type="auth.isAdmin ? 'danger' : 'info'">{{ auth.user.role }}</el-tag>
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
.side-menu { border-right: none; }

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