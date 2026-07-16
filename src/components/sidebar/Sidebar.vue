<script setup lang="ts">
// 侧边栏容器 - 桌面/平板常驻，手机抽屉式
import { ref, computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { PanelLeftClose, PanelLeftOpen, Plus, Package, Settings } from 'lucide-vue-next'
import CategoryList from './CategoryList.vue'

// 先声明 emits，再使用（避免 emit 顺序问题）
const emit = defineEmits<{
  select: []
}>()

const uiStore = useUiStore()
const { isMobile } = useBreakpoint()

// 实际是否收起：移动端抽屉里始终展开，桌面端跟随 sidebarCollapsed
const isCollapsed = computed(() => !isMobile.value && uiStore.sidebarCollapsed)

// CategoryList 组件引用，用于调用其暴露的 handleAddCategory 方法
const categoryListRef = ref<InstanceType<typeof CategoryList> | null>(null)

// 选中分类时触发（手机端用于关闭抽屉）
function handleSelect() {
  emit('select')
}

// 点击添加分类按钮：委托给 CategoryList 处理（创建+选中+进入编辑模式）
function handleAddCategory() {
  categoryListRef.value?.handleAddCategory()
}

// 切换设置/库存视图，并在移动端收起抽屉（复用 select 事件，桌面端未绑定无副作用）
function handleSettingsClick() {
  uiStore.setView(uiStore.currentView === 'settings' ? 'inventory' : 'settings')
  emit('select')
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- 顶部：品牌 + 收起按钮 -->
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <Package :size="22" class="brand-icon" />
        <span v-if="!isCollapsed" class="brand-text">库存管理</span>
      </div>
      <button
        v-if="!isMobile"
        class="collapse-btn"
        @click="uiStore.toggleSidebar()"
        :aria-label="isCollapsed ? '展开侧边栏' : '收起侧边栏'"
      >
        <PanelLeftClose v-if="!isCollapsed" :size="18" />
        <PanelLeftOpen v-else :size="18" />
      </button>
    </div>

    <!-- 分类列表 -->
    <CategoryList
      ref="categoryListRef"
      :collapsed="isCollapsed"
      @select="handleSelect"
    />

    <!-- 底部：添加分类 -->
    <div class="sidebar-footer">
      <button
        class="add-category-btn"
        :class="{ collapsed: isCollapsed }"
        @click="handleAddCategory"
        :aria-label="isCollapsed ? '添加分类' : undefined"
      >
        <Plus :size="18" />
        <span v-if="!isCollapsed">添加分类</span>
      </button>
    </div>

    <!-- 底部：系统设置 -->
    <div class="sidebar-settings">
      <button
        class="settings-btn"
        :class="{ collapsed: isCollapsed, active: uiStore.currentView === 'settings' }"
        @click="handleSettingsClick"
        :aria-label="isCollapsed ? '系统设置' : undefined"
      >
        <Settings :size="18" />
        <span v-if="!isCollapsed">系统设置</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  background: var(--color-graphite);
  color: var(--color-text-inverse);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: width var(--spring-response) var(--ease-out);
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

/* 顶部区域 */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.brand-icon {
  color: var(--color-accent);
  flex-shrink: 0;
}

.brand-text {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  color: var(--color-text-inverse);
  white-space: nowrap;
}

/* 收起/展开按钮 */
.collapse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-md);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}
.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}
.collapse-btn:active {
  transform: scale(0.97);
}

/* 底部区域 */
.sidebar-footer {
  padding: var(--space-3);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

/* 添加分类按钮：翡翠绿强调 */
.add-category-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.add-category-btn:hover {
  background: var(--color-accent-hover);
}
.add-category-btn:active {
  transform: scale(0.97);
}

/* 收起时仅显示图标 */
.add-category-btn.collapsed {
  padding: var(--space-3);
  width: 40px;
  height: 40px;
  margin: 0 auto;
}

/* 系统设置区 */
.sidebar-settings {
  padding: 0 var(--space-3) var(--space-3);
  flex-shrink: 0;
}

.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.settings-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}
.settings-btn:active {
  transform: scale(0.97);
}
.settings-btn.active {
  background: rgba(16, 185, 129, 0.15);
  color: white;
}

/* 收起时仅显示图标 */
.settings-btn.collapsed {
  padding: var(--space-3);
  width: 40px;
  height: 40px;
  margin: 0 auto;
}
</style>
