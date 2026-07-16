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
      items: '++id, categoryId, order, name, quantity',
    })

    // v2：Item 新增 lowStockAlertEnabled / lowStockThreshold 字段，给历史数据填默认值
    this.version(2).stores({
      categories: '++id, order, name',
      items: '++id, categoryId, order, name, quantity',
    }).upgrade(async (trans) => {
      await trans.table('items').toCollection().modify((item) => {
        if (item.lowStockAlertEnabled === undefined) {
          item.lowStockAlertEnabled = true
        }
        if (item.lowStockThreshold === undefined) {
          item.lowStockThreshold = 10
        }
      })
    })
  }
}

// 全局数据库实例
export const db = new InventoryDatabase()
