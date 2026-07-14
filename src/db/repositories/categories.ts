import { db } from '../database'
import type { Category } from '../types'
import { DEFAULT_CATEGORY_NAME } from '../types'

// 获取全部分类（按 order 排序）
export async function getAllCategories(): Promise<Category[]> {
  return db.categories.orderBy('order').toArray()
}

// 根据 id 获取分类
export async function getCategoryById(id: number): Promise<Category | undefined> {
  return db.categories.get(id)
}

// 创建分类（自动计算 order = 最大 order + 1）
export async function createCategory(name: string): Promise<number> {
  // 读取全部分类以计算当前最大 order
  const allCategories = await db.categories.toArray()
  const maxOrder = allCategories.length > 0
    ? Math.max(...allCategories.map(c => c.order))
    : -1
  return db.categories.add({
    name,
    order: maxOrder + 1,
    createdAt: Date.now(),
  })
}

// 重命名分类
export async function renameCategory(id: number, name: string): Promise<void> {
  await db.categories.update(id, { name })
}

// 删除分类（单事务：删除分类 + 其下库存项变为无分类 categoryId=undefined）
export async function deleteCategory(id: number): Promise<void> {
  await db.transaction('rw', db.categories, db.items, async () => {
    const itemsToMigrate = await db.items.where('categoryId').equals(id).toArray()
    const now = Date.now()
    await db.items.bulkPut(itemsToMigrate.map(item => ({
      ...item,
      categoryId: undefined,
      updatedAt: now,
    })))
    await db.categories.delete(id)
  })
}

// 批量更新排序
export async function updateCategoryOrder(categories: Category[]): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    await db.categories.bulkPut(categories)
  })
}

// 获取分类下的库存项数量（走 categoryId 索引）
export async function getItemCountByCategory(categoryId: number): Promise<number> {
  return db.items.where('categoryId').equals(categoryId).count()
}

// 迁移历史数据：将名为「未分类」的实际分类记录移除，其下库存项变为无分类（categoryId = undefined）
// 此函数在应用启动时调用，幂等（无「未分类」分类时直接返回）
export async function migrateUncategorizedCategory(): Promise<void> {
  // 查找名为「未分类」的分类（历史遗留）
  const uncategorized = await db.categories.where('name').equals(DEFAULT_CATEGORY_NAME).first()
  if (!uncategorized?.id) return

  await db.transaction('rw', db.categories, db.items, async () => {
    // 将该分类下所有库存项的 categoryId 设为 undefined（不属于任何分类）
    const itemsToMigrate = await db.items.where('categoryId').equals(uncategorized.id!).toArray()
    const now = Date.now()
    await db.items.bulkPut(itemsToMigrate.map(item => ({
      ...item,
      categoryId: undefined,
      updatedAt: now,
    })))
    // 删除「未分类」分类记录
    await db.categories.delete(uncategorized.id!)
  })
}
