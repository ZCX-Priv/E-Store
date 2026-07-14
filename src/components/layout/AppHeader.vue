<script setup lang="ts">
// 顶栏组件
import { useUiStore } from '@/stores/ui'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { Menu, LayoutGrid, List, Plus, Package } from 'lucide-vue-next'
import type { ViewMode } from '@/db'

const uiStore = useUiStore()
const { isMobile } = useBreakpoint()

// 切换视图模式
function switchView(mode: ViewMode) {
  uiStore.setViewMode(mode)
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <!-- 手机端汉堡按钮 -->
      <button
        v-if="isMobile"
        class="icon-btn"
        @click="uiStore.toggleMobileDrawer()"
        aria-label="打开菜单"
      >
        <Menu :size="20" />
      </button>

      <!-- 品牌标识 -->
      <div class="brand">
        <Package :size="20" class="brand-icon" />
        <span class="brand-name" v-if="!isMobile">库存管理</span>
      </div>
    </div>

    <div class="header-right">
      <!-- 视图切换（仅库存视图显示） -->
      <div v-if="uiStore.currentView === 'inventory'" class="view-switcher">
        <button
          class="view-btn"
          :class="{ active: uiStore.viewMode === 'grid' }"
          @click="switchView('grid')"
          aria-label="网格视图"
        >
          <LayoutGrid :size="18" />
        </button>
        <button
          class="view-btn"
          :class="{ active: uiStore.viewMode === 'list' }"
          @click="switchView('list')"
          aria-label="列表视图"
        >
          <List :size="18" />
        </button>
      </div>

      <!-- 添加按钮（仅库存视图） -->
      <button
        v-if="uiStore.currentView === 'inventory'"
        class="btn-primary"
        aria-label="添加库存项"
        @click="uiStore.openItemForm()"
      >
        <Plus :size="18" />
        <span v-if="!isMobile">添加</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  background: var(--material-header);
  backdrop-filter: blur(var(--material-blur)) saturate(var(--material-saturate));
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: var(--z-header);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.brand-icon {
  color: var(--color-accent);
}

.brand-name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  color: var(--color-text);
}

/* 图标按钮 */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}
.icon-btn:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}
.icon-btn:active {
  transform: scale(0.97);
}
.icon-btn.active {
  background: var(--color-accent);
  color: white;
}

/* 视图切换组 */
.view-switcher {
  display: flex;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  padding: 2px;
}

.view-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.view-btn:hover {
  color: var(--color-text);
}
.view-btn:active {
  transform: scale(0.97);
}
.view-btn.active {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
}

/* 主按钮 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.btn-primary:hover {
  background: var(--color-accent-hover);
}
.btn-primary:active {
  transform: scale(0.97);
}
</style>
