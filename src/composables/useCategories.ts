import { ref, onScopeDispose } from 'vue'
import { liveQuery } from 'dexie'
import { from } from 'rxjs'
import { categoryRepo, itemRepo } from '@/db'
import type { Category } from '@/db'

// 响应式获取全部分类（按 order 排序）
export function useCategories() {
  const categories = ref<Category[]>([])
  const loading = ref(true)

  // liveQuery 创建响应式查询，from 转为 RxJS Observable 再订阅
  const subscription = from(
    liveQuery(() => categoryRepo.getAllCategories())
  ).subscribe({
    next: (result) => {
      categories.value = result
      loading.value = false
    },
    error: (err) => {
      console.error('加载分类失败:', err)
      loading.value = false
    },
  })

  // 组件卸载时取消订阅
  onScopeDispose(() => subscription.unsubscribe())

  return { categories, loading }
}

// 响应式获取分类计数（每个分类下的库存项数）
export function useCategoryCount() {
  const counts = ref<Record<number, number>>({})
  const loading = ref(true)

  // 查询所有 items，按 categoryId 分组计数
  const subscription = from(
    liveQuery(async () => {
      const items = await itemRepo.getAllItems()
      const countMap: Record<number, number> = {}
      for (const item of items) {
        const key = item.categoryId ?? 0
        countMap[key] = (countMap[key] || 0) + 1
      }
      return countMap
    })
  ).subscribe({
    next: (result) => {
      counts.value = result
      loading.value = false
    },
    error: (err) => {
      console.error('加载分类计数失败:', err)
      loading.value = false
    },
  })

  onScopeDispose(() => subscription.unsubscribe())

  return { counts, loading }
}
