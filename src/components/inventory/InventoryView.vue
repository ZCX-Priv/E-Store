<script setup lang="ts">
// 库存视图容器 - 根据 viewMode 渲染网格或列表，支持拖拽排序
import { ref, watch, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useVirtualList } from '@vueuse/core'
import { useUiStore } from '@/stores/ui'
import { useItems } from '@/composables/useItems'
import { itemRepo } from '@/db'
import type { Item } from '@/db'
import ItemCard from './ItemCard.vue'
import ItemRow from './ItemRow.vue'
import InventorySummary from './InventorySummary.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { PackageX } from 'lucide-vue-next'

const uiStore = useUiStore()
const { items, loading } = useItems()

// 事件透传（由 Task 8 接管表单）
const emit = defineEmits<{
  add: []
  edit: [item: Item]
}>()

// 删除状态
const deletingItem = ref<Item | null>(null)

function requestDelete(item: Item) {
  deletingItem.value = item
}

async function confirmDelete() {
  if (deletingItem.value?.id) {
    await itemRepo.deleteItem(deletingItem.value.id)
  }
  deletingItem.value = null
}

function cancelDelete() {
  deletingItem.value = null
}

// 本地可拖拽副本（VueDraggable 需要可写 v-model，而 useItems 的 items 来自 liveQuery 只读）
const draggableItems = ref<Item[]>([])

// 正在拖拽中（防止 liveQuery 回写打断拖拽：例如 ItemCard 数量防抖写库会触发 items 刷新）
const isDragging = ref(false)

// 同步 liveQuery 数据到本地副本（拖拽中不同步，避免打断）
watch(
  () => items.value,
  (newItems) => {
    if (!isDragging.value) {
      draggableItems.value = [...newItems]
    }
  },
  { immediate: true },
)

// 拖拽开始：标记正在拖拽
function handleDragStart() {
  isDragging.value = true
}

// 拖拽结束：根据新顺序持久化到 IndexedDB
async function handleDragEnd() {
  isDragging.value = false
  const orderUpdates = draggableItems.value
    .map((item, index) => ({ id: item.id, order: index }))
    .filter((u): u is { id: number; order: number } => u.id !== undefined)
  await itemRepo.updateItemsOrder(orderUpdates)
}

// ========== 虚拟滚动（列表视图，超过 100 条时启用） ==========
// 判断是否需要虚拟滚动：少量数据用虚拟列表反而增加复杂度
const needsVirtualScroll = computed(() => items.value.length > 100)

// 虚拟列表（仅列表视图使用，网格视图因卡片高度不固定不适合固定 itemHeight 的虚拟滚动）
const { list, containerProps, wrapperProps } = useVirtualList(items, {
  itemHeight: 60, // 列表行高度
  overscan: 10, // 预渲染上下额外 10 条，减少滚动白屏
})
</script>

<template>
  <div class="inventory-view">
    <!-- 顶部总览统计 -->
    <InventorySummary />

    <!-- 加载状态 -->
    <div v-if="loading" class="state-container">
      <p class="state-text">加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="items.length === 0" class="state-container empty">
      <PackageX :size="48" class="empty-icon" />
      <p class="state-title">暂无库存项</p>
      <p class="state-desc">点击「添加」按钮创建第一个库存项</p>
      <button class="btn-primary" @click="emit('add')">
        添加库存项
      </button>
    </div>

    <!-- 网格视图 -->
    <Transition name="view-fade" mode="out-in">
      <VueDraggable
        v-if="uiStore.viewMode === 'grid'"
        key="grid"
        v-model="draggableItems"
        :animation="200"
        group="inventory"
        ghost-class="drag-ghost"
        chosen-class="drag-chosen"
        drag-class="drag-dragging"
        class="grid-view"
        @start="handleDragStart"
        @end="handleDragEnd"
      >
        <ItemCard
          v-for="item in draggableItems"
          :key="item.id"
          :item="item"
          @edit="emit('edit', $event)"
          @delete="requestDelete"
        />
      </VueDraggable>

      <!-- 列表视图（虚拟滚动，超过 100 条时启用，不支持拖拽） -->
      <div
        v-else-if="needsVirtualScroll"
        key="list-virtual"
        v-bind="containerProps"
        class="list-view-virtual"
      >
        <div v-bind="wrapperProps">
          <ItemRow
            v-for="{ data: item } in list"
            :key="item.id"
            :item="item"
            @edit="emit('edit', $event)"
            @delete="requestDelete"
          />
        </div>
      </div>

      <!-- 列表视图（普通，100 条以内，支持拖拽） -->
      <VueDraggable
        v-else
        key="list"
        v-model="draggableItems"
        :animation="200"
        group="inventory"
        ghost-class="drag-ghost"
        chosen-class="drag-chosen"
        drag-class="drag-dragging"
        class="list-view"
        @start="handleDragStart"
        @end="handleDragEnd"
      >
        <ItemRow
          v-for="item in draggableItems"
          :key="item.id"
          :item="item"
          @edit="emit('edit', $event)"
          @delete="requestDelete"
        />
      </VueDraggable>
    </Transition>

    <!-- 删除确认 -->
    <ConfirmDialog
      :show="!!deletingItem"
      title="删除库存项"
      :message="`确定要删除「${deletingItem?.name}」吗？此操作不可撤销。`"
      confirm-text="删除"
      danger
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
.inventory-view {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* 网格视图：自适应列宽 */
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

/* 列表视图：纵向排列 */
.list-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* 虚拟列表容器：固定高度 + 内部滚动（containerProps 已设置 overflow-y: auto） */
.list-view-virtual {
  height: 70vh;
  max-height: 800px;
}

/* 状态容器：居中布局 */
.state-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  color: var(--color-text-tertiary);
}

/* 空状态：纵向居中 */
.state-container.empty {
  flex-direction: column;
  text-align: center;
}

.empty-icon {
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-4);
}

.state-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

.state-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

.state-text {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
}

/* 主操作按钮 */
.btn-primary {
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

/* 视图切换过渡：交叉淡入淡出 */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}
.view-fade-enter-from,
.view-fade-leave-to {
  opacity: 0;
}

/* 拖拽视觉反馈（class 由 SortableJS 添加到子元素上，需用 :deep 穿透 scoped） */
/* 占位符：半透明，表示插入位置 */
:deep(.drag-ghost) {
  opacity: 0.4;
  background: var(--color-bg-subtle) !important;
}

/* 被选中的项：抓手光标 */
:deep(.drag-chosen) {
  cursor: grabbing;
}

/* 正在拖拽的项：抬起阴影 + 微缩放，营造悬浮感 */
:deep(.drag-dragging) {
  opacity: 0.9;
  transform: scale(1.02) rotate(1deg);
  box-shadow: var(--shadow-xl) !important;
}

/* 卡片交错进入动画：前 6 个依次延迟，营造层叠出现效果 */
:deep(.item-card),
:deep(.item-row) {
  animation: card-enter var(--spring-response) var(--ease-out) backwards;
}

/* 网格视图卡片：content-visibility 优化，减少非可视区域渲染开销 */
:deep(.item-card) {
  content-visibility: auto;
  contain-intrinsic-size: 200px;
}

:deep(.item-card:nth-child(1)),
:deep(.item-row:nth-child(1)) {
  animation-delay: 0ms;
}
:deep(.item-card:nth-child(2)),
:deep(.item-row:nth-child(2)) {
  animation-delay: 30ms;
}
:deep(.item-card:nth-child(3)),
:deep(.item-row:nth-child(3)) {
  animation-delay: 60ms;
}
:deep(.item-card:nth-child(4)),
:deep(.item-row:nth-child(4)) {
  animation-delay: 90ms;
}
:deep(.item-card:nth-child(5)),
:deep(.item-row:nth-child(5)) {
  animation-delay: 120ms;
}
:deep(.item-card:nth-child(6)),
:deep(.item-row:nth-child(6)) {
  animation-delay: 150ms;
}
/* 超过 6 个的不延迟，避免过度动画 */
</style>
