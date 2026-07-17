import { useInventoryData } from './useInventoryData'

// 响应式获取全部分类（按 order 排序）
export function useCategories() {
  const { allCategories, categoriesLoading } = useInventoryData()
  return { categories: allCategories, loading: categoriesLoading }
}

// 响应式获取分类计数（每个分类下的库存项数）
export function useCategoryCount() {
  const { categoryCounts, itemsLoading } = useInventoryData()
  return { counts: categoryCounts, loading: itemsLoading }
}
