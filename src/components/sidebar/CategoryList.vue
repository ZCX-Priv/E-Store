<script setup lang="ts">
// 分类列表 - 含固定项（全部、未分类）和动态分类
import { ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useCategories, useCategoryCount } from '@/composables/useCategories'
import { useToast } from '@/composables/useToast'
import { categoryRepo, itemRepo } from '@/db'
import { SPECIAL_CATEGORIES } from '@/db'
import { Layers, PackageOpen, FolderX } from 'lucide-vue-next'
import CategoryItem from './CategoryItem.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

const uiStore = useUiStore()
const { categories, loading } = useCategories()
const { counts } = useCategoryCount()
const toast = useToast()

// 正在编辑的分类 id（单一数据源，由 CategoryList 统一管理）
const editingId = ref<number | null>(null)

// 选中分类
function selectCategory(id: string | number) {
  uiStore.setView('inventory')
  uiStore.selectCategory(id)
  emit('select')
}

// 添加分类：创建后自动选中并进入编辑模式
async function handleAddCategory() {
  const name = `新分类 ${categories.value.length + 1}`
  const id = await categoryRepo.createCategory(name)
  // 自动选中新建分类（直接调用 store，不 emit select 事件，避免移动端抽屉关闭）
  uiStore.setView('inventory')
  uiStore.selectCategory(id)
  // 进入编辑模式（CategoryItem 通过 watch 响应 editing 变化）
  editingId.value = id
}

// 进入编辑模式（由 CategoryItem 的 start-edit 事件触发）
function startEdit(id: number) {
  editingId.value = id
}

// 重命名分类
async function handleRename(id: number, name: string) {
  try {
    await categoryRepo.renameCategory(id, name)
    toast.success('分类已重命名')
  } catch (err) {
    console.error('重命名失败:', err)
    toast.error('重命名失败')
  }
  editingId.value = null
}

// 取消编辑
function cancelEdit() {
  editingId.value = null
}

// 删除分类确认
const deletingCategory = ref<{ id: number; name: string } | null>(null)

function requestDelete(id: number, name: string) {
  deletingCategory.value = { id, name }
}

// 确认删除：其下库存项变为无分类（categoryId = undefined）
async function confirmDelete() {
  if (!deletingCategory.value) return
  const id = deletingCategory.value.id
  try {
    await categoryRepo.deleteCategory(id)
    // 如果删除的是当前选中的分类，切回「全部」
    // 直接调用 store，不 emit select 事件，避免移动端抽屉被关闭
    if (uiStore.selectedCategoryId === id) {
      uiStore.setView('inventory')
      uiStore.selectCategory(SPECIAL_CATEGORIES.ALL)
    }
    toast.success('分类已删除')
  } catch (err) {
    console.error('删除分类失败:', err)
    toast.error('删除失败，请重试')
  }
  deletingCategory.value = null
}

// 取消删除
function cancelDelete() {
  deletingCategory.value = null
}

// 获取分类计数
function getCount(id: number): number {
  return counts.value[id] || 0
}

// 计算全部库存项总数
function getTotalCount(): number {
  return Object.values(counts.value).reduce((a, b) => a + b, 0)
}

// 跨分类移动库存项：拖拽到目标分类后，计算新 order（目标分类最大 order + 1）并写库
// liveQuery 会自动刷新当前视图与分类计数
async function handleMoveItem(itemId: number, categoryId: number) {
  const itemsInTarget = await itemRepo.getItemsByCategory(categoryId)
  const maxOrder = itemsInTarget.length > 0
    ? Math.max(...itemsInTarget.map((i) => i.order))
    : -1
  await itemRepo.moveItemToCategory(itemId, categoryId, maxOrder + 1)
}

// 暴露 handleAddCategory 供父组件 Sidebar 调用
defineExpose({
  handleAddCategory,
})
</script>

<template>
  <nav class="category-list">
    <!-- 固定项：全部 -->
    <button
      class="category-item"
      :class="{ active: uiStore.currentView === 'inventory' && uiStore.selectedCategoryId === SPECIAL_CATEGORIES.ALL }"
      @click="selectCategory(SPECIAL_CATEGORIES.ALL)"
      :title="collapsed ? '全部' : undefined"
    >
      <Layers :size="18" class="item-icon" />
      <span v-if="!collapsed" class="item-name">全部</span>
      <span v-if="!collapsed" class="item-count">{{ getTotalCount() }}</span>
    </button>

    <!-- 固定项：未分类 -->
    <button
      class="category-item"
      :class="{ active: uiStore.currentView === 'inventory' && uiStore.selectedCategoryId === SPECIAL_CATEGORIES.UNCATEGORIZED }"
      @click="selectCategory(SPECIAL_CATEGORIES.UNCATEGORIZED)"
      :title="collapsed ? '未分类' : undefined"
    >
      <PackageOpen :size="18" class="item-icon" />
      <span v-if="!collapsed" class="item-name">未分类</span>
    </button>

    <!-- 分隔线 -->
    <div v-if="!collapsed" class="divider"></div>
    <div v-else class="divider-collapsed"></div>

    <!-- 动态分类 -->
    <CategoryItem
      v-for="cat in categories"
      :key="cat.id"
      :category="cat"
      :collapsed="collapsed"
      :count="getCount(cat.id!)"
      :active="uiStore.currentView === 'inventory' && uiStore.selectedCategoryId === cat.id"
      :editing="editingId === cat.id"
      @select="selectCategory(cat.id!)"
      @start-edit="startEdit(cat.id!)"
      @rename="(name: string) => handleRename(cat.id!, name)"
      @cancel-edit="cancelEdit"
      @delete="requestDelete(cat.id!, cat.name)"
      @move-item="handleMoveItem"
    />

    <!-- 空状态：暂无分类（收起时不显示，空间不足） -->
    <div v-if="!loading && categories.length === 0 && !collapsed" class="empty-categories">
      <FolderX :size="32" class="empty-cat-icon" />
      <p class="empty-cat-title">暂无分类</p>
      <p class="empty-cat-desc">点击下方「添加分类」按钮创建</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && !collapsed" class="loading">加载中...</div>

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      :show="!!deletingCategory"
      title="删除分类"
      :message="`确定要删除「${deletingCategory?.name}」吗？该分类下的库存项将变为未分类（不属于任何分类）。`"
      confirm-text="删除"
      danger
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </nav>
</template>

<style scoped>
.category-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  flex: 1;
  overflow-y: auto;
}

/* 固定分类项（全部、未分类） */
.category-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  background: transparent;
  border: none;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
  position: relative;
  overflow: hidden;
  font-family: var(--font-sans);
}

.category-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

/* 选中状态：翡翠绿背景 + 左侧强调条 */
.category-item.active {
  background: rgba(16, 185, 129, 0.15);
  color: white;
}
.category-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--color-accent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.item-icon {
  flex-shrink: 0;
}

.item-name {
  flex: 1;
  font-size: var(--text-sm);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 计数标签 */
.item-count {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

/* 分隔线 */
.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: var(--space-2) var(--space-2);
}

.divider-collapsed {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: var(--space-2) 8px;
}

/* 加载状态 */
.loading {
  padding: var(--space-3);
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: var(--text-xs);
}

/* 空分类占位：撑满剩余空间并居中 */
.empty-categories {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  text-align: center;
  gap: var(--space-1);
  min-height: 160px;
}

.empty-cat-icon {
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: var(--space-2);
}

.empty-cat-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.empty-cat-desc {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
  line-height: var(--leading-normal);
}
</style>
