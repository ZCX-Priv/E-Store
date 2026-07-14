import { ref, onScopeDispose } from 'vue'
import { liveQuery } from 'dexie'
import { from } from 'rxjs'
import { itemRepo } from '@/db'

// 响应式获取库存统计（总条目数、总价值、低库存数）
export function useInventoryStats(lowStockThreshold: number = 10) {
  const totalCount = ref(0)
  const totalValue = ref(0)
  const lowStockCount = ref(0)
  const loading = ref(true)

  const subscription = from(
    liveQuery(async () => {
      const items = await itemRepo.getAllItems()
      return {
        total: items.length,
        value: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        lowStock: items.filter((i) => i.quantity <= lowStockThreshold).length,
      }
    })
  ).subscribe({
    next: (result) => {
      totalCount.value = result.total
      totalValue.value = result.value
      lowStockCount.value = result.lowStock
      loading.value = false
    },
    error: (err) => {
      console.error('加载统计失败:', err)
      loading.value = false
    },
  })

  onScopeDispose(() => subscription.unsubscribe())

  return { totalCount, totalValue, lowStockCount, loading }
}
