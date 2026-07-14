import Dexie, { type Table } from 'dexie'
import type { Category, Item } from './types'

// 库存管理数据库
export class InventoryDatabase extends Dexie {
  categories!: Table<Category, number>
  items!: Table<Item, number>

  constructor() {
    super('InventoryDB')
    // 定义表结构与索引
    this.version(1).stores({
      // 主键 id，order 用于排序，name 用于按名查找
      categories: '++id, order, name',
      // categoryId、order、quantity 建立索引以优化查询
      // quantity 索引用于低库存统计（belowOrEqual 范围查询）
      items: '++id, categoryId, order, name, quantity',
    })
  }
}

// 全局数据库实例
export const db = new InventoryDatabase()
