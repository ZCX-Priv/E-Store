import { db } from '../database'
import type { Item } from '../types'

// 获取全部库存项（按 order 排序）
export async function getAllItems(): Promise<Item[]> {
  return db.items.orderBy('order').toArray()
}

// 按分类获取库存项（走 categoryId 索引，按 order 排序）
export async function getItemsByCategory(categoryId: number): Promise<Item[]> {
  return db.items.where('categoryId').equals(categoryId).sortBy('order')
}

// 根据 id 获取库存项
export async function getItemById(id: number): Promise<Item | undefined> {
  return db.items.get(id)
}

// 创建库存项（自动计算 order = 该分类下最大 order + 1，设置 createdAt/updatedAt）
// 已知限制：order 为「分类内相对序」，跨分类的 order 值会重叠；因此「全部」视图按
// order 排序时，不同分类的项可能交错（仅影响初始展示顺序，拖拽后会重写为全局 index）
export async function createItem(
  data: Omit<Item, 'id' | 'order' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  let maxOrder = -1
  if (data.categoryId !== undefined) {
    const itemsInCategory = await db.items.where('categoryId').equals(data.categoryId).toArray()
    // reduce 求最大，避免 Math.max(...大数组) 的参数栈溢出
    maxOrder = itemsInCategory.reduce((m, i) => Math.max(m, i.order), -1)
  } else {
    // 无分类：遍历所有 categoryId 为 undefined 的库存项求最大 order
    const allItems = await db.items.toArray()
    maxOrder = allItems.reduce((m, i) => (i.categoryId === undefined ? Math.max(m, i.order) : m), -1)
  }
  const now = Date.now()
  return db.items.add({
    ...data,
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  })
}

// 更新库存项（更新 updatedAt）
export async function updateItem(
  id: number,
  data: Partial<Omit<Item, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.items.update(id, {
    ...data,
    updatedAt: Date.now(),
  })
}

// 删除库存项
export async function deleteItem(id: number): Promise<void> {
  await db.items.delete(id)
}

// 批量写入（用于 Excel 导入，单事务）
export async function bulkPutItems(items: Item[]): Promise<void> {
  await db.transaction('rw', db.items, async () => {
    await db.items.bulkPut(items)
  })
}

// 批量添加（用于 Excel 导入，单事务），返回新增条目的主键数组
export async function bulkAddItems(items: Omit<Item, 'id'>[]): Promise<number[]> {
  return db.transaction('rw', db.items, async () => {
    return db.items.bulkAdd(items, { allKeys: true })
  })
}

// 更新排序（批量，单事务）
export async function updateItemsOrder(items: { id: number; order: number }[]): Promise<void> {
  await db.transaction('rw', db.items, async () => {
    await db.items.bulkUpdate(items.map(({ id, order }) => ({
      key: id,
      changes: { order },
    })))
  })
}

// 设置数量
export async function setItemQuantity(id: number, quantity: number): Promise<void> {
  await db.items.update(id, {
    quantity,
    updatedAt: Date.now(),
  })
}

// 跨分类移动（更新 categoryId 和 order）
export async function moveItemToCategory(
  id: number,
  categoryId: number,
  newOrder: number,
): Promise<void> {
  await db.items.update(id, {
    categoryId,
    order: newOrder,
    updatedAt: Date.now(),
  })
}
