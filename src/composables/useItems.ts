import { computed } from 'vue'
import type { Item } from '@/db'
import { useUiStore } from '@/stores/ui'
import { SPECIAL_CATEGORIES } from '@/db'
import { useInventoryData } from './useInventoryData'

// 响应式获取库存项（根据当前选中分类过滤）
// 从共享数据源派生，切换分类时仅重算 computed，无需重新订阅数据库
export function useItems() {
  const uiStore = useUiStore()
  const { allItems, itemsLoading } = useInventoryData()

  // getAllItems 已按 order 升序，过滤后各分类内相对顺序保持不变
  const items = computed<Item[]>(() => {
    const catId = uiStore.selectedCategoryId
    if (catId === SPECIAL_CATEGORIES.ALL) {
      return allItems.value
    }
    if (catId === SPECIAL_CATEGORIES.UNCATEGORIZED) {
      // 未分类：categoryId 为空或不存在
      return allItems.value.filter((i) => !i.categoryId)
    }
    return allItems.value.filter((i) => i.categoryId === Number(catId))
  })

  return { items, loading: itemsLoading }
}
