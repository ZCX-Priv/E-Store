// Excel 导入导出工具 - 基于 xlsx 库
import * as XLSX from 'xlsx'
import type { Item, Category } from '@/db'

// Excel 列名映射（中文表头）
const EXCEL_COLUMNS = {
  name: '名称',
  category: '分类',
  quantity: '数量',
  unit: '单位',
  price: '价格',
  description: '描述',
} as const

// 导出库存项为 Excel 文件
export function exportItemsToExcel(items: Item[], categories: Category[]): void {
  // 构建 categoryId -> name 映射，用于在导出时显示分类名称
  const categoryMap = new Map<number, string>()
  for (const cat of categories) {
    if (cat.id) categoryMap.set(cat.id, cat.name)
  }

  // 将库存项转换为带中文表头的行数据
  const data = items.map((item) => ({
    [EXCEL_COLUMNS.name]: item.name,
    [EXCEL_COLUMNS.category]: categoryMap.get(item.categoryId ?? 0) || '未分类',
    [EXCEL_COLUMNS.quantity]: item.quantity,
    [EXCEL_COLUMNS.unit]: item.unit,
    [EXCEL_COLUMNS.price]: item.price,
    [EXCEL_COLUMNS.description]: item.description,
  }))

  // 创建工作表
  const ws = XLSX.utils.json_to_sheet(data)

  // 设置列宽，提升可读性
  ws['!cols'] = [
    { wch: 20 }, // 名称
    { wch: 15 }, // 分类
    { wch: 10 }, // 数量
    { wch: 10 }, // 单位
    { wch: 12 }, // 价格
    { wch: 30 }, // 描述
  ]

  // 创建工作簿并追加工作表
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '库存')

  // 生成含日期的文件名
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const fileName = `库存导出_${dateStr}.xlsx`

  // 写入文件（浏览器端触发下载）
  XLSX.writeFile(wb, fileName)
}

// 导入预览结果接口
export interface ImportPreview {
  // 解析出的待导入项（不含 id/order/createdAt/updatedAt，由导入时补全）
  items: Array<Omit<Item, 'id' | 'order' | 'createdAt' | 'updatedAt'>>
  // 总条目数
  total: number
  // 与现有库存同名的冲突数
  conflicts: number
  // 冲突项明细
  conflictItems: Array<{ name: string; existing?: Item }>
}

// 解析 Excel 文件为预览数据，不直接写入数据库
export async function parseExcelFile(
  file: File,
  existingItems: Item[],
  categories: Category[],
): Promise<ImportPreview> {
  // 读取文件为 ArrayBuffer
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  // 获取第一个工作表
  const wsName = wb.SheetNames[0]
  const ws = wb.Sheets[wsName]

  // 转为 JSON 行数组
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

  // 构建 分类 name -> id 映射
  const categoryMap = new Map<string, number>()
  for (const cat of categories) {
    if (cat.id) categoryMap.set(cat.name, cat.id)
  }

  // 获取「未分类」分类 id 作为回退
  const uncategorizedId = categories.find((c) => c.name === '未分类')?.id

  // 逐行解析
  const parsedItems: ImportPreview['items'] = []
  const conflictItems: ImportPreview['conflictItems'] = []

  for (const row of rows) {
    const name = String(row[EXCEL_COLUMNS.name] ?? '').trim()
    // 空名称行跳过
    if (!name) continue

    const categoryName = String(row[EXCEL_COLUMNS.category] ?? '未分类').trim()
    const categoryId = categoryMap.get(categoryName) || uncategorizedId || 0

    const item = {
      name,
      categoryId,
      quantity: Number(row[EXCEL_COLUMNS.quantity] ?? 0) || 0,
      unit: String(row[EXCEL_COLUMNS.unit] ?? '个').trim(),
      price: Number(row[EXCEL_COLUMNS.price] ?? 0) || 0,
      description: String(row[EXCEL_COLUMNS.description] ?? '').trim(),
    }

    parsedItems.push(item)

    // 检查冲突：与现有库存同名
    const existing = existingItems.find((i) => i.name === name)
    if (existing) {
      conflictItems.push({ name, existing })
    }
  }

  return {
    items: parsedItems,
    total: parsedItems.length,
    conflicts: conflictItems.length,
    conflictItems,
  }
}
