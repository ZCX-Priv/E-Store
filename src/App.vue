<script setup lang="ts">
// 应用根组件 - 整体布局
import { computed, onMounted, watch } from 'vue'
import { usePreferredDark } from '@vueuse/core'
import { useUiStore } from '@/stores/ui'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { useToast } from '@/composables/useToast'
import { categoryRepo } from '@/db'
import { safeGetItem, safeSetItem } from '@/utils/storage'
import AppHeader from '@/components/layout/AppHeader.vue'
import Sidebar from '@/components/sidebar/Sidebar.vue'
import MainContent from '@/components/layout/MainContent.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import PwaUpdateToast from '@/components/common/PwaUpdateToast.vue'

const uiStore = useUiStore()
const { isMobile } = useBreakpoint()
const toast = useToast()

// 系统暗色偏好（响应式，自动监听 prefers-color-scheme 变化）
const systemPrefersDark = usePreferredDark()

// 计算实际生效的主题：'system' 时跟随系统偏好
const effectiveTheme = computed<'light' | 'dark'>(() => {
  if (uiStore.theme === 'system') {
    return systemPrefersDark.value ? 'dark' : 'light'
  }
  return uiStore.theme
})

// watch 并应用到 <html data-theme="...">，immediate 确保挂载前就应用避免闪烁
watch(
  effectiveTheme,
  (next) => {
    document.documentElement.dataset.theme = next
  },
  { immediate: true }
)

// 应用启动时初始化默认分类
onMounted(async () => {
  await categoryRepo.migrateUncategorizedCategory()
  // 首次进入欢迎（持久化，仅显示一次）
  if (!safeGetItem('inventory-welcomed')) {
    toast.info('欢迎使用 E-Store 库存管理')
    safeSetItem('inventory-welcomed', 'true')
  }
})
</script>

<template>
  <div class="app-layout">
    <!-- 桌面/平板侧边栏（常驻） -->
    <Sidebar v-if="!isMobile" class="sidebar-desktop" />

    <!-- 手机端抽屉式侧边栏 -->
    <template v-else>
      <!-- 遮罩 -->
      <Transition name="overlay">
        <div
          v-if="uiStore.mobileDrawerOpen"
          class="drawer-overlay"
          @click="uiStore.setMobileDrawer(false)"
        />
      </Transition>
      <!-- 抽屉 -->
      <Transition name="drawer">
        <Sidebar
          v-if="uiStore.mobileDrawerOpen"
          class="sidebar-mobile"
          @select="uiStore.setMobileDrawer(false)"
        />
      </Transition>
    </template>

    <!-- 主区域 -->
    <div class="app-main">
      <AppHeader />
      <MainContent />
    </div>

    <!-- 全局 Toast 通知（Teleport 到 body，放置位置不影响层级） -->
    <ToastContainer />

    <!-- PWA 新版本更新提示 -->
    <PwaUpdateToast />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
}

/* 桌面侧边栏 */
.sidebar-desktop {
  flex-shrink: 0;
  height: 100vh;
  height: 100dvh;
  position: sticky;
  top: 0;
}

/* 手机抽屉 */
.sidebar-mobile {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  height: 100dvh;
  z-index: var(--z-drawer);
}

.drawer-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
  z-index: var(--z-drawer-overlay);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 抽屉过渡 */
.drawer-enter-active,
.drawer-leave-active {
  transition: transform var(--spring-response) var(--ease-out);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active,
  .drawer-leave-active {
    transition: opacity var(--duration-normal) ease;
  }
}
</style>
