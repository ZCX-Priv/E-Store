<script setup lang="ts">
// 设置视图 - 数据导入导出、主题模式、关于信息
import { ref, computed, onMounted } from 'vue'
import type { Component } from 'vue'
import { Download, Upload, Package, ChevronLeft, Sun, Moon, Monitor, Github } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import type { ThemeMode } from '@/stores/ui'
import { itemRepo, categoryRepo } from '@/db'
import { exportItemsToExcel, parseExcelFile, type ImportPreview } from '@/utils/excel'
import { useToast } from '@/composables/useToast'
import type { Item, Category } from '@/db'

const uiStore = useUiStore()
const toast = useToast()

// 当前数据快照
const allItems = ref<Item[]>([])
const allCategories = ref<Category[]>([])

// 挂载时加载一次数据用于展示统计
onMounted(async () => {
  allItems.value = await itemRepo.getAllItems()
  allCategories.value = await categoryRepo.getAllCategories()
})

// ========== 导出 ==========
async function handleExport() {
  try {
    // 导出前重新获取最新数据
    allItems.value = await itemRepo.getAllItems()
    allCategories.value = await categoryRepo.getAllCategories()
    exportItemsToExcel(allItems.value, allCategories.value)
    toast.success(`已导出 ${allItems.value.length} 项`)
  } catch (err) {
    console.error('导出失败:', err)
    toast.error('导出失败，请重试')
  }
}

// ========== 导入 ==========
const fileInput = ref<HTMLInputElement | null>(null)
const importPreview = ref<ImportPreview | null>(null)
const importing = ref(false)
// 冲突处理方式：跳过或覆盖
const importMode = ref<'overwrite' | 'skip'>('skip')

function triggerFileSelect() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 刷新现有数据，确保冲突检测基于最新状态
  allItems.value = await itemRepo.getAllItems()
  allCategories.value = await categoryRepo.getAllCategories()

  // 解析 Excel 文件
  try {
    const preview = await parseExcelFile(file, allItems.value, allCategories.value)
    if (preview.total === 0) {
      // 无可导入数据：提示且不打开预览
      toast.info('文件中未找到可导入的数据')
    } else {
      importPreview.value = preview
    }
  } catch (err) {
    console.error('解析 Excel 失败:', err)
    toast.error('解析 Excel 失败，请检查文件格式')
  }

  // 重置 input，以便重复选择同一文件
  target.value = ''
}

// 确认导入：根据冲突处理模式写入数据库
async function confirmImport() {
  if (!importPreview.value) return

  importing.value = true
  try {
    const now = Date.now()
    // 原始解析项（仅字段，不含 order/createdAt/updatedAt）
    const rawItems = importPreview.value.items
    // 新增项的起始 order：现有最大 order + 1，避免与既有项撞位
    const baseOrder = allItems.value.reduce((m, i) => Math.max(m, i.order), -1) + 1
    // 把原始解析项装配为「新增」用的完整 Item（补 order/createdAt/updatedAt）
    const decorateNew = (item: ImportPreview['items'][number], offset: number): Omit<Item, 'id'> => ({
      ...item,
      order: baseOrder + offset,
      createdAt: now,
      updatedAt: now,
    })

    // 实际写入（新增+覆盖）条数，用于反馈提示
    let importedCount = 0

    // 现有库存 name -> item 映射（首个同名者优先），O(1) 查找，避免逐项 find/some 的 O(n^2)
    const existingByName = new Map<string, Item>()
    for (const it of allItems.value) {
      if (it.id && !existingByName.has(it.name)) existingByName.set(it.name, it)
    }

    if (importMode.value === 'overwrite' && importPreview.value.conflicts > 0) {
      // 覆盖模式：更新同名项，添加新项
      const toUpdate: Item[] = []
      const toAdd: Omit<Item, 'id'>[] = []

      for (const item of rawItems) {
        const existing = existingByName.get(item.name)
        if (existing && existing.id) {
          // 覆盖字段，但保留既有 id / order / createdAt
          toUpdate.push({ ...existing, ...item, id: existing.id, updatedAt: now })
        } else {
          toAdd.push(decorateNew(item, toAdd.length))
        }
      }

      if (toUpdate.length > 0) {
        await itemRepo.bulkPutItems(toUpdate)
      }
      if (toAdd.length > 0) {
        await itemRepo.bulkAddItems(toAdd)
      }
      importedCount = toUpdate.length + toAdd.length
    } else {
      // 跳过模式：仅添加非冲突项
      const conflictNames = new Set(importPreview.value!.conflictItems.map((c) => c.name))
      const toAdd = rawItems
        .filter((item) => !conflictNames.has(item.name))
        .map((item, i) => decorateNew(item, i))
      if (toAdd.length > 0) {
        await itemRepo.bulkAddItems(toAdd)
      }
      importedCount = toAdd.length
    }

    importPreview.value = null

    // 成功反馈：有写入则提示条数，否则（跳过模式全为同名项）提示未导入
    if (importedCount > 0) {
      toast.success(`成功导入 ${importedCount} 项`)
    } else {
      toast.info('全部为同名项，未导入任何数据')
    }
  } catch (err) {
    console.error('导入失败:', err)
    toast.error('导入失败，请重试')
  } finally {
    importing.value = false
  }
}

function cancelImport() {
  importPreview.value = null
}

// ========== 主题模式 ==========
// 三态切换选项：跟随系统 / 白昼 / 夜间
const themeOptions: ReadonlyArray<{ value: ThemeMode; label: string; icon: Component }> = [
  { value: 'system', label: '跟随系统', icon: Monitor },
  { value: 'light', label: '白昼', icon: Sun },
  { value: 'dark', label: '夜间', icon: Moon },
]

// 当前主题对应的图标（卡片头部展示）
const currentThemeIcon = computed<Component>(() => {
  const opt = themeOptions.find((o) => o.value === uiStore.theme)
  return opt?.icon ?? Monitor
})

function setTheme(mode: ThemeMode) {
  uiStore.setTheme(mode)
  const label = themeOptions.find((o) => o.value === mode)?.label ?? ''
  toast.info(`已切换主题：${label}`)
}

// ========== 返回库存页 ==========
function goBack() {
  uiStore.setView('inventory')
}
</script>

<template>
  <div class="settings-page">
    <!-- 返回按钮（贴左，不参与限宽居中） -->
    <button class="back-btn" @click="goBack">
      <ChevronLeft :size="18" />
      返回库存
    </button>

    <div class="settings-view">
      <!-- 偏好设置 -->
      <section class="settings-section">
      <h2 class="section-title">偏好设置</h2>

      <div class="setting-cards">
      <!-- 主题模式 -->
      <div class="setting-card">
        <div class="card-header">
          <component :is="currentThemeIcon" :size="20" class="card-icon" />
          <div>
            <h3 class="card-name">主题模式</h3>
            <p class="card-desc">切换白昼 / 夜间外观，或跟随系统偏好</p>
          </div>
        </div>
        <div class="theme-switcher" role="radiogroup" aria-label="主题模式">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            type="button"
            role="radio"
            :aria-checked="uiStore.theme === opt.value"
            class="theme-option"
            :class="{ active: uiStore.theme === opt.value }"
            @click="setTheme(opt.value)"
          >
            <component :is="opt.icon" :size="16" />
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </div>
      </div>
    </section>

    <!-- 数据管理 -->
    <section class="settings-section">
      <h2 class="section-title">数据管理</h2>

      <div class="setting-cards">
        <!-- 导出 -->
        <div class="setting-card">
          <div class="card-header">
            <Download :size="20" class="card-icon" />
            <div>
              <h3 class="card-name">导出 Excel</h3>
              <p class="card-desc">将所有库存数据导出为 .xlsx 文件</p>
            </div>
          </div>
          <button class="btn-primary" :disabled="allItems.length === 0" @click="handleExport">
            导出（{{ allItems.length }} 项）
          </button>
        </div>

        <!-- 导入 -->
        <div class="setting-card">
          <div class="card-header">
            <Upload :size="20" class="card-icon" />
            <div>
              <h3 class="card-name">导入 Excel</h3>
              <p class="card-desc">从 .xlsx 文件批量导入库存数据</p>
            </div>
          </div>
          <button class="btn-secondary" @click="triggerFileSelect">
            选择文件
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            class="file-input-hidden"
            @change="handleFileChange"
          />
        </div>
      </div>
    </section>

    <!-- 关于 -->
    <section class="settings-section">
      <h2 class="section-title">关于</h2>
      <div class="about-card">
        <Package :size="32" class="about-icon" />
        <div class="about-content">
          <div class="about-title-row">
            <h3 class="about-name">E-Store</h3>
            <a
              href="https://github.com/ZCX-Priv/E-Store"
              target="_blank"
              rel="noopener noreferrer"
              class="about-link"
              aria-label="GitHub 仓库"
            >
              <Github :size="18" />
            </a>
          </div>
          <p class="about-version">版本 1.0.0</p>
        </div>
      </div>
    </section>
    </div>

    <!-- 导入预览模态框（Teleport 到 body，确保层级正确） -->
    <Teleport to="body">
    <Transition name="confirm">
      <div v-if="importPreview" class="modal-overlay">
        <div class="modal-dialog">
          <h3 class="modal-title">确认导入</h3>

          <!-- 统计信息 -->
          <div class="modal-stats">
            <div class="stat-item">
              <span class="stat-label">总条目数</span>
              <span class="stat-value">{{ importPreview.total }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">冲突数</span>
              <span
                class="stat-value"
                :class="{ 'stat-warning': importPreview.conflicts > 0 }"
              >
                {{ importPreview.conflicts }}
              </span>
            </div>
          </div>

          <!-- 冲突处理选项（仅在有冲突时显示） -->
          <div v-if="importPreview.conflicts > 0" class="conflict-options">
            <p class="conflict-label">冲突处理方式</p>
            <label class="radio-option">
              <input
                v-model="importMode"
                type="radio"
                value="skip"
              />
              <span>跳过同名项</span>
            </label>
            <label class="radio-option">
              <input
                v-model="importMode"
                type="radio"
                value="overwrite"
              />
              <span>覆盖同名项</span>
            </label>
          </div>

          <!-- 操作按钮 -->
          <div class="modal-actions">
            <button class="btn-cancel" :disabled="importing" @click="cancelImport">
              取消
            </button>
            <button class="btn-confirm" :disabled="importing" @click="confirmImport">
              {{ importing ? '导入中...' : '导入' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* 页面容器：不限宽，button 贴左 */
.settings-page {
  /* 继承 .main-content 的 padding，无需额外样式 */
}

/* 视图容器：居中限宽（内容仍居中） */
.settings-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-6);
}

/* 返回按钮：透明文字按钮 */
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  margin: 0 0 var(--space-2) 0;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}
.back-btn:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}
.back-btn:active {
  transform: scale(0.97);
}

/* 分区 */
.settings-section {
  margin-bottom: var(--space-8);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

/* 卡片网格 */
.setting-cards {
  display: grid;
  gap: var(--space-4);
}

/* 单张设置卡片 */
.setting-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

/* 卡片图标：默认翡翠绿 */
.card-icon {
  color: var(--color-accent);
  flex-shrink: 0;
  margin-top: 2px;
}
/* 警告图标：琥珀色 */
.card-icon.warning {
  color: var(--color-warning);
}

.card-name {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--space-1) 0;
}

.card-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

/* 隐藏的文件输入 */
.file-input-hidden {
  display: none;
}

/* 主操作按钮：翡翠绿 */
.btn-primary {
  padding: var(--space-2) var(--space-4);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out),
              opacity var(--duration-fast) var(--ease-out);
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}
.btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 次级按钮：白底边框 */
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.btn-secondary:hover {
  background: var(--color-bg-subtle);
}
.btn-secondary:active {
  transform: scale(0.97);
}

/* 主题切换器：分段式三选一 */
.theme-switcher {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-1);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
}

.theme-option {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.theme-option:hover {
  color: var(--color-text);
}
.theme-option:active {
  transform: scale(0.97);
}
.theme-option.active {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
}

/* 关于卡片 */
.about-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-lg);
}

.about-icon {
  color: var(--color-accent);
  flex-shrink: 0;
}

.about-name {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.about-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.about-link {
  display: inline-flex;
  align-items: center;
  color: var(--color-text-tertiary);
  transition: color var(--duration-fast) var(--ease-out);
}
.about-link:hover {
  color: var(--color-accent);
}

.about-version {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2) 0;
}

/* ========== 导入预览模态框 ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.modal-dialog {
  z-index: var(--z-modal);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  max-width: 420px;
  width: 100%;
  box-shadow: var(--shadow-2xl);
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--space-4) 0;
}

/* 统计信息 */
.modal-stats {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-4);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}

/* 冲突数高亮：琥珀色 */
.stat-warning {
  color: var(--color-warning);
}

/* 冲突处理选项 */
.conflict-options {
  padding: var(--space-4);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.conflict-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
  margin: 0 0 var(--space-3) 0;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
}

.radio-option input[type='radio'] {
  accent-color: var(--color-accent);
  cursor: pointer;
}

/* 模态框按钮组 */
.modal-actions {
  display: flex;
  gap: var(--space-3);
}

.btn-cancel {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.btn-cancel:hover:not(:disabled) {
  background: var(--color-border);
}
.btn-cancel:active:not(:disabled) {
  transform: scale(0.97);
}
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-confirm {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out),
              opacity var(--duration-fast) var(--ease-out);
}
.btn-confirm:hover:not(:disabled) {
  background: var(--color-accent-hover);
}
.btn-confirm:active:not(:disabled) {
  transform: scale(0.97);
}
.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模态框过渡动画：遮罩淡入 + 对话框缩放 */
.confirm-enter-active,
.confirm-leave-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}
.confirm-enter-active .modal-dialog,
.confirm-leave-active .modal-dialog {
  transition: transform var(--spring-response) var(--ease-out),
              opacity var(--duration-normal) var(--ease-out);
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
.confirm-enter-from .modal-dialog,
.confirm-leave-to .modal-dialog {
  transform: scale(0.92);
  opacity: 0;
}
</style>
