import { ref, computed } from 'vue'
import { liveQuery, type Subscription } from 'dexie'
import { itemRepo, categoryRepo } from '@/db'
import type { Item, Category } from '@/db'

// ============================================================
// 应用级共享数据源（单例）
// 全仓库存项与分类各仅维持 1 个 liveQuery 订阅，供 useItems /
// useCategories / useCategoryCount / useInventoryStats 复用，
// 避免多个组件各自 getAllItems() 造成的重复全表扫描与重复订阅。
// 数据在应用整个生命周期内需要，故订阅在首次使用时创建后常驻。
// ============================================================

// ===== 单例：全部库存项 =====
const allItems = ref<Item[]>([])
const itemsLoading = ref(true)
let itemsSub: Subscription | null = null

function ensureItemsSubscription(): void {
  if (itemsSub) return
  // Dexie liveQuery 返回可订阅的 Observable，无需 rxjs 包裹
  itemsSub = liveQuery(() => itemRepo.getAllItems()).subscribe({
    next: (result) => {
      allItems.value = result
      itemsLoading.value = false
    },
    error: (err) => {
      console.error('加载库存项失败:', err)
      itemsLoading.value = false
    },
  })
}

// ===== 单例：全部分类 =====
const allCategories = ref<Category[]>([])
const categoriesLoading = ref(true)
let categoriesSub: Subscription | null = null

function ensureCategoriesSubscription(): void {
  if (categoriesSub) return
  categoriesSub = liveQuery(() => categoryRepo.getAllCategories()).subscribe({
    next: (result) => {
      allCategories.value = result
      categoriesLoading.value = false
    },
    error: (err) => {
      console.error('加载分类失败:', err)
      categoriesLoading.value = false
    },
  })
}

// ===== 派生：分类计数（categoryId -> 数量，未分类归入 key 0） =====
const categoryCounts = computed<Record<number, number>>(() => {
  const map: Record<number, number> = {}
  for (const item of allItems.value) {
    const key = item.categoryId ?? 0
    map[key] = (map[key] || 0) + 1
  }
  return map
})

// ===== 派生：库存统计（总数 / 总价值 / 低库存数，单趟遍历） =====
const inventoryStats = computed(() => {
  let value = 0
  let lowStock = 0
  for (const i of allItems.value) {
    value += i.price * i.quantity
    if (i.lowStockAlertEnabled && i.quantity <= i.lowStockThreshold) lowStock++
  }
  return { total: allItems.value.length, value, lowStock }
})

// 共享数据源入口：首次调用时惰性建立订阅
export function useInventoryData() {
  ensureItemsSubscription()
  ensureCategoriesSubscription()
  return {
    allItems,
    itemsLoading,
    allCategories,
    categoriesLoading,
    categoryCounts,
    inventoryStats,
  }
}
