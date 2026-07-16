<script setup lang="ts">
// 库存总览统计
import { computed } from 'vue'
import { useInventoryStats } from '@/composables/useItemCount'
import { Package, DollarSign, AlertTriangle } from 'lucide-vue-next'

// 低库存阈值已下沉到每项，这里无需全局阈值
const { totalCount, totalValue, lowStockCount, loading } = useInventoryStats()

// 格式化价值（千分位）
const formattedValue = computed(() => {
  return totalValue.value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
})

// 加载占位（避免数字闪烁）
const displayCount = computed(() => (loading.value ? '—' : String(totalCount.value)))
const displayLowStock = computed(() => (loading.value ? '—' : String(lowStockCount.value)))
const displayValue = computed(() => (loading.value ? '—' : formattedValue.value))
</script>

<template>
  <div class="inventory-summary">
    <!-- 总条目数 -->
    <div class="summary-card">
      <div class="summary-icon">
        <Package :size="20" />
      </div>
      <div class="summary-content">
        <span class="summary-label">总条目</span>
        <span class="summary-value">{{ displayCount }}</span>
        <span class="summary-unit">项</span>
      </div>
    </div>

    <!-- 总价值 -->
    <div class="summary-card accent">
      <div class="summary-icon">
        <DollarSign :size="20" />
      </div>
      <div class="summary-content">
        <span class="summary-label">总价值</span>
        <span class="summary-value">¥{{ displayValue }}</span>
      </div>
    </div>

    <!-- 低库存预警 -->
    <div class="summary-card" :class="{ warning: lowStockCount > 0 }">
      <div class="summary-icon">
        <AlertTriangle :size="20" />
      </div>
      <div class="summary-content">
        <span class="summary-label">低库存预警</span>
        <span class="summary-value">{{ displayLowStock }}</span>
        <span class="summary-unit">项</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 总览容器：自适应多列网格 */
.inventory-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

/* 单张统计卡片 */
.summary-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}

.summary-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* 图标圆形容器 */
.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-card.accent .summary-icon {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-accent);
}

.summary-card.warning .summary-icon {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

/* 文本内容区 */
.summary-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

/* 标签：小号、次要色、大写 */
.summary-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 大数字：使用正文字体 */
.summary-value {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: var(--weight-normal);
  color: var(--color-text);
  line-height: 1;
}

/* 单位：跟随正文字体 */
.summary-unit {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
}

/* 响应式：手机端单列 */
@media (max-width: 640px) {
  .inventory-summary {
    grid-template-columns: 1fr;
  }
}
</style>
