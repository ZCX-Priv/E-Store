<script setup lang="ts">
// 库存项表单模态框（添加/编辑）
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import { itemRepo, categoryRepo } from '@/db'
import type { Item, Category } from '@/db'

const props = defineProps<{
  show: boolean
  editItem: Item | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

// 表单数据
const formData = ref<{
  name: string
  quantity: number
  unit: string
  categoryId: number | undefined
  price: number
  description: string
}>({
  name: '',
  quantity: 0,
  unit: '个',
  categoryId: undefined,
  price: 0,
  description: '',
})

// 分类列表
const categories = ref<Category[]>([])

// 分类下拉框的代理值：桥接字符串（DOM 需要）与 number | undefined（数据层）
// '' 表示「不分类」（categoryId = undefined），其他为分类 id 的字符串形式
const categoryIdProxy = computed<string>({
  get() {
    return formData.value.categoryId === undefined
      ? ''
      : String(formData.value.categoryId)
  },
  set(val: string) {
    formData.value.categoryId = val === '' ? undefined : Number(val)
  },
})

// 错误信息
const errors = ref<{ name?: string; quantity?: string; price?: string }>({})

// 模态框根元素引用（用于焦点陷阱）
const modalRef = ref<HTMLElement | null>(null)
// 名称输入框引用（用于自动聚焦）
const nameInputRef = ref<HTMLInputElement | null>(null)
// 打开模态框前的焦点元素（关闭时恢复）
let lastFocusedElement: HTMLElement | null = null

// 是否编辑模式
const isEdit = computed(() => !!props.editItem)

// 标题
const title = computed(() => isEdit.value ? '编辑库存项' : '添加库存项')

// 加载分类
async function loadCategories() {
  categories.value = await categoryRepo.getAllCategories()
}

// 监听 show 变化，重置表单并管理焦点
watch(() => props.show, async (newShow) => {
  if (newShow) {
    // 保存当前焦点元素，关闭时恢复
    lastFocusedElement = document.activeElement as HTMLElement
    await loadCategories()
    if (props.editItem) {
      // 编辑模式：预填
      formData.value = {
        name: props.editItem.name,
        quantity: props.editItem.quantity,
        unit: props.editItem.unit,
        categoryId: props.editItem.categoryId,
        price: props.editItem.price,
        description: props.editItem.description,
      }
    } else {
      // 添加模式：重置，默认「不分类」
      formData.value = {
        name: '',
        quantity: 0,
        unit: '个',
        categoryId: undefined,
        price: 0,
        description: '',
      }
    }
    errors.value = {}
    // 等待 DOM 更新后聚焦名称输入框
    await nextTick()
    nameInputRef.value?.focus()
  } else {
    // 关闭时恢复焦点到触发元素
    lastFocusedElement?.focus()
    lastFocusedElement = null
  }
})

// 校验
function validate(): boolean {
  errors.value = {}
  if (!formData.value.name.trim()) {
    errors.value.name = '名称不能为空'
  }
  if (formData.value.quantity < 0) {
    errors.value.quantity = '数量不能为负'
  }
  if (formData.value.price < 0) {
    errors.value.price = '价格不能为负'
  }
  return Object.keys(errors.value).length === 0
}

// 保存
const saving = ref(false)
async function handleSave() {
  if (!validate()) return

  saving.value = true
  try {
    const data = {
      name: formData.value.name.trim(),
      quantity: formData.value.quantity,
      unit: formData.value.unit.trim() || '个',
      categoryId: formData.value.categoryId,
      price: formData.value.price,
      description: formData.value.description.trim(),
    }

    if (isEdit.value && props.editItem?.id) {
      await itemRepo.updateItem(props.editItem.id, data)
    } else {
      await itemRepo.createItem(data)
    }
    emit('saved')
    emit('close')
  } catch (err) {
    console.error('保存失败:', err)
  } finally {
    saving.value = false
  }
}

// Tab 键焦点陷阱：在模态框内循环，不跳到背景
function handleTabKey(e: KeyboardEvent) {
  if (!modalRef.value) return
  const focusable = modalRef.value.querySelectorAll<HTMLElement>(
    'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
  )
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  // Shift+Tab 在第一个元素上：跳到最后一个
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    // Tab 在最后一个元素上：跳到第一个
    e.preventDefault()
    first.focus()
  }
}

// 键盘事件：ESC 关闭，Tab 焦点陷阱
function handleKeydown(e: KeyboardEvent) {
  if (!props.show) return
  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'Tab') {
    handleTabKey(e)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-dialog" ref="modalRef" role="dialog" aria-modal="true" :aria-label="title">
          <!-- 头部 -->
          <div class="modal-header">
            <h2 class="modal-title">{{ title }}</h2>
            <button class="close-btn" @click="emit('close')" aria-label="关闭">
              <X :size="18" />
            </button>
          </div>

          <!-- 表单 -->
          <form class="modal-body" @submit.prevent="handleSave">
            <!-- 名称 -->
            <div class="form-field">
              <label class="field-label">名称 <span class="required">*</span></label>
              <input
                ref="nameInputRef"
                v-model="formData.name"
                type="text"
                class="field-input"
                :class="{ error: errors.name }"
                placeholder="输入库存项名称"
              />
              <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
            </div>

            <!-- 数量 + 单位 -->
            <div class="form-row">
              <div class="form-field">
                <label class="field-label">数量</label>
                <input
                  v-model.number="formData.quantity"
                  type="number"
                  min="0"
                  class="field-input"
                  :class="{ error: errors.quantity }"
                />
                <span v-if="errors.quantity" class="field-error">{{ errors.quantity }}</span>
              </div>
              <div class="form-field">
                <label class="field-label">单位</label>
                <input
                  v-model="formData.unit"
                  type="text"
                  class="field-input"
                  placeholder="个/箱/kg"
                />
              </div>
            </div>

            <!-- 分类 -->
            <div class="form-field">
              <label class="field-label">分类</label>
              <select v-model="categoryIdProxy" class="field-input field-select">
                <option value="">不分类</option>
                <option v-for="cat in categories" :key="cat.id" :value="String(cat.id)">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <!-- 价格 -->
            <div class="form-field">
              <label class="field-label">价格 (元)</label>
              <input
                v-model.number="formData.price"
                type="number"
                min="0"
                step="0.01"
                class="field-input"
                :class="{ error: errors.price }"
              />
              <span v-if="errors.price" class="field-error">{{ errors.price }}</span>
            </div>

            <!-- 描述 -->
            <div class="form-field">
              <label class="field-label">描述</label>
              <textarea
                v-model="formData.description"
                class="field-input field-textarea"
                rows="3"
                placeholder="可选备注信息"
              />
            </div>
          </form>

          <!-- 底部按钮 -->
          <div class="modal-footer">
            <button class="btn-cancel" @click="emit('close')">取消</button>
            <button class="btn-primary" :disabled="saving" @click="handleSave">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 遮罩层：全屏覆盖 + 毛玻璃模糊 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: var(--z-modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

/* 对话框主体：抬升表面 + 大圆角 + 深阴影 */
.modal-dialog {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

/* 头部：标题 + 关闭按钮 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin: 0;
}

/* 关闭按钮：透明方形，hover 浅灰 */
.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.close-btn:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}
.close-btn:active {
  transform: scale(0.97);
}

/* 表单主体：纵向排列，统一间距 */
.modal-body {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 双列表单行 */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

/* 表单字段：标签 + 输入 + 错误 */
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
}

/* 必填标记 */
.required {
  color: var(--color-danger);
}

/* 输入框统一样式 */
.field-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}
.field-input:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}
.field-input.error {
  border-color: var(--color-danger);
}

/* 下拉选择框 */
.field-select {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

/* 文本域：允许垂直拉伸 */
.field-textarea {
  resize: vertical;
  font-family: inherit;
}

/* 字段错误提示 */
.field-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
}

/* 底部按钮区 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
}

/* 取消按钮：透明边框 */
.btn-cancel {
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.btn-cancel:hover {
  background: var(--color-bg-subtle);
}
.btn-cancel:active {
  transform: scale(0.97);
}

/* 主按钮：强调色填充 */
.btn-primary {
  padding: var(--space-2) var(--space-4);
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.btn-primary:hover {
  background: var(--color-accent-hover);
}
.btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 过渡动画：遮罩淡入，对话框从中心缩放展开 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}
.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
  transition: transform var(--spring-response) var(--ease-out),
              opacity var(--duration-normal) var(--ease-out);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
  transform: scale(0.92);
  opacity: 0;
}

/* 降低动效偏好：禁用缩放变换 */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active .modal-dialog,
  .modal-leave-active .modal-dialog {
    transform: none !important;
  }
}
</style>
