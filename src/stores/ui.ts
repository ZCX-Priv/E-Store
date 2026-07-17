import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ViewMode, Item } from '@/db'
import { SPECIAL_CATEGORIES } from '@/db'

// 主题模式：用户选择（'system' 表示跟随系统偏好）
export type ThemeMode = 'light' | 'dark' | 'system'

// 从 localStorage 读取选中的分类标识
// 可能是特殊分类（'all' / 'uncategorized'）或数字 ID
function loadSelectedCategoryId(): string | number {
  const stored = localStorage.getItem('inventory-selected-category')
  if (stored === null) return SPECIAL_CATEGORIES.ALL
  // 特殊分类标识直接返回字符串
  if (stored === SPECIAL_CATEGORIES.ALL || stored === SPECIAL_CATEGORIES.UNCATEGORIZED) {
    return stored
  }
  // 数字 ID 转换为 number，转换失败则回退到 ALL
  const num = Number(stored)
  return isNaN(num) ? SPECIAL_CATEGORIES.ALL : num
}

// UI 状态 Store
export const useUiStore = defineStore('ui', () => {
  // 当前视图模式（grid/list），从 localStorage 读取
  const viewMode = ref<ViewMode>(
    (localStorage.getItem('inventory-view-mode') as ViewMode | null) || 'grid'
  )

  // 侧边栏是否收起（桌面端）
  const sidebarCollapsed = ref<boolean>(
    localStorage.getItem('inventory-sidebar-collapsed') === 'true'
  )

  // 当前选中的分类标识（'all' | 'uncategorized' | number 类型的 categoryId）
  const selectedCategoryId = ref<string | number>(loadSelectedCategoryId())

  // 移动端抽屉是否打开
  const mobileDrawerOpen = ref(false)

  // 当前主视图（'inventory' | 'settings'）
  const currentView = ref<'inventory' | 'settings'>('inventory')

  // 主题模式（用户选择），从 localStorage 读取，默认跟随系统
  const theme = ref<ThemeMode>(
    (localStorage.getItem('inventory-theme') as ThemeMode | null) || 'system'
  )

  // 库存项表单状态（跨组件共享：AppHeader 触发添加、MainContent 渲染模态框）
  const itemFormOpen = ref(false)
  const editingItem = ref<Item | null>(null)

  // 最近一次「跨分类拖拽移动」的库存项 id
  // 用于让 InventoryView.handleDragEnd 跳过对该项的重排序写入，避免与移动写入并发冲突
  const recentMovedItemId = ref<number | null>(null)

  // 设置视图模式并持久化
  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
    localStorage.setItem('inventory-view-mode', mode)
  }

  // 切换侧边栏收起状态并持久化
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('inventory-sidebar-collapsed', String(sidebarCollapsed.value))
  }

  // 设置侧边栏收起状态
  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed
    localStorage.setItem('inventory-sidebar-collapsed', String(collapsed))
  }

  // 选中分类并持久化
  function selectCategory(id: string | number) {
    selectedCategoryId.value = id
    localStorage.setItem('inventory-selected-category', String(id))
  }

  // 打开/关闭移动端抽屉
  function setMobileDrawer(open: boolean) {
    mobileDrawerOpen.value = open
  }

  // 切换移动端抽屉
  function toggleMobileDrawer() {
    mobileDrawerOpen.value = !mobileDrawerOpen.value
  }

  // 切换主视图
  function setView(view: 'inventory' | 'settings') {
    currentView.value = view
  }

  // 设置主题模式并持久化
  function setTheme(mode: ThemeMode) {
    theme.value = mode
    localStorage.setItem('inventory-theme', mode)
  }

  // 打开库存项表单（无参数=新建，传 Item=编辑）
  function openItemForm(item: Item | null = null) {
    editingItem.value = item
    itemFormOpen.value = true
  }

  // 关闭库存项表单
  function closeItemForm() {
    itemFormOpen.value = false
  }

  // 标记某库存项刚被跨分类移动（供拖拽重排序逻辑规避并发写入）
  function markItemMoved(id: number) {
    recentMovedItemId.value = id
  }

  // 清除跨分类移动标记
  function clearMovedItem() {
    recentMovedItemId.value = null
  }

  return {
    viewMode,
    sidebarCollapsed,
    selectedCategoryId,
    mobileDrawerOpen,
    currentView,
    theme,
    itemFormOpen,
    editingItem,
    recentMovedItemId,
    setViewMode,
    toggleSidebar,
    setSidebarCollapsed,
    selectCategory,
    setMobileDrawer,
    toggleMobileDrawer,
    setView,
    setTheme,
    openItemForm,
    closeItemForm,
    markItemMoved,
    clearMovedItem,
  }
})
