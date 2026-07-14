import { ref, onScopeDispose, watch } from 'vue'
import { liveQuery } from 'dexie'
import { from } from 'rxjs'
import type { Subscription } from 'rxjs'
import { itemRepo } from '@/db'
import type { Item } from '@/db'
import { useUiStore } from '@/stores/ui'
import { SPECIAL_CATEGORIES } from '@/db'

// 响应式获取库存项（根据当前选中分类自动过滤）
export function useItems() {
  const uiStore = useUiStore()
  const items = ref<Item[]>([])
  const loading = ref(true)

  // 当前活跃的订阅，切换分类时需取消旧订阅
  let subscription: Subscription | null = null

  // 监听 selectedCategoryId 变化，重新订阅 liveQuery
  const stop = watch(
    () => uiStore.selectedCategoryId,
    (catId) => {
      // 取消旧订阅
      if (subscription) {
        subscription.unsubscribe()
      }

      loading.value = true
      const query = liveQuery(async () => {
        if (catId === SPECIAL_CATEGORIES.ALL) {
          return itemRepo.getAllItems()
        } else if (catId === SPECIAL_CATEGORIES.UNCATEGORIZED) {
          // 未分类：categoryId 为空或不存在的分类
          const all = await itemRepo.getAllItems()
          return all.filter((i) => !i.categoryId)
        } else {
          return itemRepo.getItemsByCategory(Number(catId))
        }
      })

      subscription = from(query).subscribe({
        next: (result) => {
          items.value = result
          loading.value = false
        },
        error: (err) => {
          console.error('加载库存项失败:', err)
          loading.value = false
        },
      })
    },
    { immediate: true }
  )

  // 组件卸载时停止监听并取消订阅
  onScopeDispose(() => {
    stop()
    if (subscription) {
      subscription.unsubscribe()
    }
  })

  return { items, loading }
}

// 响应式获取全部库存项（无过滤）
export function useAllItems() {
  const items = ref<Item[]>([])
  const loading = ref(true)

  const subscription = from(
    liveQuery(() => itemRepo.getAllItems())
  ).subscribe({
    next: (result) => {
      items.value = result
      loading.value = false
    },
    error: (err) => {
      console.error('加载库存项失败:', err)
      loading.value = false
    },
  })

  onScopeDispose(() => subscription.unsubscribe())

  return { items, loading }
}
