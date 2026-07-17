<script setup lang="ts">
// 库存项卡片（网格视图）
import { ref, watch, onUnmounted } from 'vue'
import { Minus, Plus, Pencil, Trash2, Package } from 'lucide-vue-next'
import type { Item } from '@/db'
import { itemRepo } from '@/db'

const props = defineProps<{
  item: Item
}>()

const emit = defineEmits<{
  edit: [item: Item]
  delete: [item: Item]
}>()

// 本地数量（即时反馈）
const localQuantity = ref(props.item.quantity)

// 是否有未落库的本地改动：防止 liveQuery 回写在交互中途覆盖本地值（导致快速点击丢失）
const dirty = ref(false)

// 监听 props 变化同步：仅在无未落库改动时同步；DB 追平本地值后解除保护
watch(() => props.item.quantity, (newVal) => {
  if (!dirty.value) {
    localQuantity.value = newVal
  } else if (newVal === localQuantity.value) {
    dirty.value = false
  }
})

// 数量变化高亮
const pulse = ref(false)

// 防抖写库
let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function adjustQuantity(delta: number) {
  // 即时更新本地值并标记为脏
  localQuantity.value = Math.max(0, localQuantity.value + delta)
  dirty.value = true
  // 高亮动画
  pulse.value = true
  setTimeout(() => { pulse.value = false }, 600)

  // 防抖写库（300ms）：写入绝对值，避免基于过期 props 的 delta 叠加
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    if (props.item.id) {
      await itemRepo.setItemQuantity(props.item.id, localQuantity.value)
    }
  }, 300)
}

// 卸载时清理未触发的防抖定时器
onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

// 是否低库存：按该项自身的预警开关与阈值判定
const isLowStock = () =>
  props.item.lowStockAlertEnabled && props.item.quantity <= props.item.lowStockThreshold

// 拖拽开始：写入 item id 到 dataTransfer，供侧边栏分类项接收（跨分类移动）
// 此处与 vue-draggable-plus 的同分类排序共存：SortableJS 默认使用原生 HTML5 拖拽，
// 该监听器在子元素上先于容器触发，不会打断同分类排序
function onDragStart(e: DragEvent) {
  if (e.dataTransfer && props.item.id !== undefined) {
    e.dataTransfer.setData('text/item-id', String(props.item.id))
    e.dataTransfer.effectAllowed = 'copyMove'
  }
}
</script>

<template>
  <div class="item-card" :class="{ 'low-stock': isLowStock() }" @dragstart="onDragStart">
    <!-- 头部：图标 + 操作 -->
    <div class="card-header">
      <div class="card-header-left">
        <div class="card-icon">
          <Package :size="18" />
        </div>
        <span v-if="isLowStock()" class="low-stock-badge">
          低库存
        </span>
      </div>
      <div class="card-actions">
        <button class="action-btn" @click="emit('edit', item)" aria-label="编辑">
          <Pencil :size="14" />
        </button>
        <button class="action-btn danger" @click="emit('delete', item)" aria-label="删除">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <!-- 名称 -->
    <h3 class="card-title">{{ item.name }}</h3>

    <!-- 描述（可选） -->
    <p v-if="item.description" class="card-desc">{{ item.description }}</p>

    <!-- 数量区 -->
    <div class="card-quantity" :class="{ pulse }">
      <button
        class="qty-btn"
        @click="adjustQuantity(-1)"
        :disabled="localQuantity <= 0"
        aria-label="减少"
      >
        <Minus :size="16" />
      </button>
      <div class="qty-display">
        <span class="qty-number">{{ localQuantity }}</span>
        <span class="qty-unit">{{ item.unit }}</span>
      </div>
      <button class="qty-btn" @click="adjustQuantity(1)" aria-label="增加">
        <Plus :size="16" />
      </button>
    </div>

    <!-- 底部：价格 -->
    <div class="card-footer">
      <span v-if="item.price > 0" class="card-price">
        ¥{{ item.price.toFixed(2) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.item-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.item-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.item-card.low-stock .card-icon {
  color: var(--color-warning);
}

/* 头部：图标 + 操作按钮 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--color-bg-subtle);
  color: var(--color-accent);
}

.card-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}
.item-card:hover .card-actions {
  opacity: 1;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.action-btn:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}
.action-btn:active {
  transform: scale(0.97);
}
.action-btn.danger:hover {
  background: rgba(var(--color-danger-rgb), 0.12);
  color: var(--color-danger);
}

/* 标题 */
.card-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  margin-bottom: var(--space-1);
}

/* 描述：单行省略 */
.card-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--space-4);
}

/* 数量控制区 */
.card-quantity {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-2);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  transition: background var(--duration-fast) var(--ease-out);
}
.card-quantity.pulse {
  animation: value-pulse 600ms var(--ease-out);
}

.qty-display {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  min-width: 80px;
  justify-content: center;
}

.qty-number {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  letter-spacing: 0.05em;
}

.qty-unit {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.qty-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.qty-btn:hover {
  background: var(--color-accent);
  color: var(--color-text-inverse);
}
.qty-btn:active {
  transform: scale(0.97);
}
.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 底部：价格 + 低库存警示 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-2);
}

.card-price {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.low-stock-badge {
  font-size: var(--text-xs);
  background: rgba(var(--color-warning-rgb), 0.12);
  color: var(--color-warning);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: var(--weight-medium);
}
</style>
