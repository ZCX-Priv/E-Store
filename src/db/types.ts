// 分类接口
export interface Category {
  id?: number
  name: string
  order: number
  createdAt: number
}

// 库存项接口
export interface Item {
  id?: number
  name: string
  categoryId: number | undefined
  quantity: number
  unit: string
  price: number
  description: string
  lowStockAlertEnabled: boolean  // 是否启用低库存预警
  lowStockThreshold: number      // 低库存预警阈值
  order: number
  createdAt: number
  updatedAt: number
}

// 视图模式
export type ViewMode = 'grid' | 'list'

// 特殊分类标识
export const SPECIAL_CATEGORIES = {
  ALL: 'all', // 全部
  UNCATEGORIZED: 'uncategorized', // 未分类（未分配 categoryId 的）
} as const

// 默认分类名称
export const DEFAULT_CATEGORY_NAME = '未分类'
