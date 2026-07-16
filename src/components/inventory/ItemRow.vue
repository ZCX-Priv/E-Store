<script setup lang="ts">
// 库存项行（列表视图）
import { ref, watch } from 'vue'
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

const localQuantity = ref(props.item.quantity)
watch(() => props.item.quantity, (v) => { localQuantity.value = v })

let timer: ReturnType<typeof setTimeout> | null = null

async function adjustQuantity(delta: number) {
  localQuantity.value = Math.max(0, localQuantity.value + delta)
  if (timer) clearTimeout(timer)
  timer = setTimeout(async () => {
    if (props.item.id) {
      await itemRepo.adjustItemQuantity(props.item.id, localQuantity.value - props.item.quantity)
    }
  }, 300)
}

// 是否低库存：按该项自身的预警开关与阈值判定
const isLowStock = () =>
  props.item.lowStockAlertEnabled && props.item.quantity <= props.item.lowStockThreshold

// 拖拽开始：写入 item id 到 dataTransfer，供侧边栏分类项接收（跨分类移动）
// 与 vue-draggable-plus 的同分类排序共存，详见 ItemCard 中同样注释
function onDragStart(e: DragEvent) {
  if (e.dataTransfer && props.item.id !== undefined) {
    e.dataTransfer.setData('text/item-id', String(props.item.id))
    e.dataTransfer.effectAllowed = 'copyMove'
  }
}
</script>

<template>
  <div class="item-row" :class="{ 'low-stock': isLowStock() }" @dragstart="onDragStart">
    <!-- 图标 -->
    <div class="row-icon">
      <Package :size="16" />
    </div>

    <!-- 名称 + 描述 -->
    <div class="row-name">
      <span class="name-text">{{ item.name }}</span>
      <span v-if="item.description" class="name-desc">{{ item.description }}</span>
    </div>

    <!-- 数量控制 -->
    <div class="row-quantity">
      <button class="qty-btn-sm" @click="adjustQuantity(-1)" :disabled="localQuantity <= 0" aria-label="减少">
        <Minus :size="14" />
      </button>
      <span class="qty-text">{{ localQuantity }} {{ item.unit }}</span>
      <button class="qty-btn-sm" @click="adjustQuantity(1)" aria-label="增加">
        <Plus :size="14" />
      </button>
    </div>

    <!-- 价格 -->
    <span v-if="item.price > 0" class="row-price">¥{{ item.price.toFixed(2) }}</span>

    <!-- 操作 -->
    <div class="row-actions">
      <button class="action-btn" @click="emit('edit', item)" aria-label="编辑">
        <Pencil :size="14" />
      </button>
      <button class="action-btn danger" @click="emit('delete', item)" aria-label="删除">
        <Trash2 :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.item-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  transition: box-shadow var(--duration-fast) var(--ease-out);
}
.item-row:hover {
  box-shadow: var(--shadow-sm);
}
.item-row.low-stock .row-icon {
  color: var(--color-warning);
}

/* 图标 */
.row-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-bg-subtle);
  color: var(--color-accent);
  flex-shrink: 0;
}

/* 名称区 */
.row-name {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name-text {
  font-weight: var(--weight-medium);
  font-size: var(--text-sm);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name-desc {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 数量控制 */
.row-quantity {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  padding: 2px;
  flex-shrink: 0;
}

.qty-btn-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.qty-btn-sm:hover {
  background: var(--color-bg-elevated);
  color: var(--color-accent);
}
.qty-btn-sm:active:not(:disabled) {
  transform: scale(0.97);
}
.qty-btn-sm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-text {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--text-sm);
  min-width: 60px;
  text-align: center;
  color: var(--color-text);
  letter-spacing: 0.05em;
}

/* 价格 */
.row-price {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  min-width: 80px;
  text-align: right;
  flex-shrink: 0;
}

/* 操作按钮 */
.row-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}
.item-row:hover .row-actions {
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
</style>
