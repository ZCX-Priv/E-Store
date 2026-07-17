import { computed } from 'vue'
import { useInventoryData } from './useInventoryData'

// 响应式获取库存统计（总条目数、总价值、低库存数）
// 从共享数据源派生，低库存按每项自身的 lowStockAlertEnabled + lowStockThreshold 判定
export function useInventoryStats() {
  const { inventoryStats, itemsLoading } = useInventoryData()

  const totalCount = computed(() => inventoryStats.value.total)
  const totalValue = computed(() => inventoryStats.value.value)
  const lowStockCount = computed(() => inventoryStats.value.lowStock)

  return { totalCount, totalValue, lowStockCount, loading: itemsLoading }
}
