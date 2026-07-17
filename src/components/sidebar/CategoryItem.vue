<script setup lang="ts">
// 单个分类项 - 支持行内编辑与操作按钮，并作为跨分类拖拽的放置目标
import { ref, nextTick, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Folder, Pencil, Trash2, Check, X, MoreHorizontal } from 'lucide-vue-next'
import type { Category } from '@/db'

const props = defineProps<{
  category: Category
  collapsed: boolean
  count: number
  active: boolean
  editing: boolean
}>()

const emit = defineEmits<{
  select: []
  rename: [name: string]
  'cancel-edit': []
  delete: []
  'start-edit': []
  // 跨分类移动：把指定库存项移入此分类
  'move-item': [itemId: number, categoryId: number]
}>()

// 编辑中的临时名称
const editName = ref('')
// 输入框引用
const inputRef = ref<HTMLInputElement | null>(null)
// 一次编辑会话是否已结束：兜底 blur 与 click/esc 的竞争，避免重复提交
const finishing = ref(false)

// 三点菜单展开状态
const menuOpen = ref(false)
// 菜单根元素引用（用于 onClickOutside）
const menuRef = ref<HTMLElement | null>(null)

// 点击菜单外关闭菜单
onClickOutside(menuRef, () => {
  menuOpen.value = false
})

// 切换菜单
function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

// 菜单项：编辑
function menuEdit() {
  menuOpen.value = false
  startEdit()
}

// 菜单项：删除
function menuDelete() {
  menuOpen.value = false
  emit('delete')
}

// 监听 editing 状态变化：进入编辑模式时初始化名称并聚焦输入框
// 这样设计是因为 editing 由父组件统一管理（单一数据源），
// 当父组件设置 editingId 时，对应 item 的 editing 变 true，此处响应
watch(() => props.editing, async (isEditing) => {
  if (isEditing) {
    // 进入编辑会话时重置结束标志
    finishing.value = false
    editName.value = props.category.name
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  }
}, { immediate: true })

// 点击重命名按钮：通知父组件进入编辑模式
function startEdit() {
  emit('start-edit')
}

// 保存编辑（finishing 兜底：一次会话只结束一次，避免 blur 与 click 重复触发）
function save() {
  if (finishing.value) return
  finishing.value = true
  const name = editName.value.trim()
  if (name && name !== props.category.name) {
    emit('rename', name)
  } else {
    emit('cancel-edit')
  }
}

// 取消编辑（同样受 finishing 保护，确保 Esc / 取消按钮真正取消而不被 blur 抢先保存）
function requestCancel() {
  if (finishing.value) return
  finishing.value = true
  emit('cancel-edit')
}

// ===== 跨分类拖拽放置目标 =====
// 是否有库存项正拖拽悬停在此分类上（用于高亮反馈）
const dragOver = ref(false)

// 拖拽悬停：允许 drop 并显示高亮
function onDragOver(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  dragOver.value = true
}

// 拖拽离开：仅当真正离开整个分类项时才取消高亮（避免经过子元素时闪烁）
function onDragLeave(e: DragEvent) {
  const related = e.relatedTarget as Node | null
  const current = e.currentTarget as Node
  if (!related || !current.contains(related)) {
    dragOver.value = false
  }
}

// 放置：读取 item id，通知父组件执行跨分类移动
function onDrop(e: DragEvent) {
  dragOver.value = false
  const itemIdStr = e.dataTransfer?.getData('text/item-id')
  if (itemIdStr && props.category.id !== undefined) {
    const itemId = Number(itemIdStr)
    if (!Number.isNaN(itemId)) {
      emit('move-item', itemId, props.category.id)
    }
  }
}
</script>

<template>
  <div class="category-item-wrapper">
    <!-- 编辑模式 -->
    <div v-if="editing" class="edit-mode">
      <input
        ref="inputRef"
        v-model="editName"
        class="edit-input"
        @keyup.enter="save"
        @keyup.esc="requestCancel"
        @blur="save"
      />
      <button class="edit-btn confirm" @mousedown.prevent @click="save" aria-label="确认">
        <Check :size="14" />
      </button>
      <button class="edit-btn cancel" @mousedown.prevent @click="requestCancel" aria-label="取消">
        <X :size="14" />
      </button>
    </div>

    <!-- 正常模式 -->
    <div
      v-else
      class="category-item"
      :class="{ active, 'drag-over': dragOver }"
      @click="emit('select')"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      :title="collapsed ? category.name : undefined"
    >
      <Folder :size="18" class="item-icon" />
      <span v-if="!collapsed" class="item-name">{{ category.name }}</span>
      <span v-if="!collapsed" class="item-count">{{ count }}</span>

      <!-- 操作按钮：常亮三点按钮 + 二级菜单 -->
      <div v-if="!collapsed" class="item-actions" @click.stop>
        <div class="more-menu-wrapper" ref="menuRef">
          <button
            class="action-btn more-btn"
            :class="{ active: menuOpen }"
            @click="toggleMenu"
            aria-label="更多操作"
            aria-haspopup="true"
            :aria-expanded="menuOpen"
          >
            <MoreHorizontal :size="16" />
          </button>
          <!-- 二级菜单 -->
          <Transition name="menu">
            <div v-if="menuOpen" class="more-menu" role="menu">
              <button class="menu-item" @click="menuEdit" role="menuitem">
                <Pencil :size="14" />
                <span>编辑</span>
              </button>
              <button class="menu-item danger" @click="menuDelete" role="menuitem">
                <Trash2 :size="14" />
                <span>删除</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-item-wrapper {
  position: relative;
}

/* 分类项主体 */
.category-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
  position: relative;
  overflow: visible;
}

.category-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-inverse);
}

/* 选中状态：翡翠绿背景 + 左侧 3px 强调条 */
.category-item.active {
  background: rgba(var(--color-accent-rgb), 0.15);
  color: var(--color-text-inverse);
}
.category-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--color-accent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

/* 跨分类拖拽悬停：高亮虚线边框，提示可放置 */
.category-item.drag-over {
  background: rgba(var(--color-accent-rgb), 0.22);
  color: var(--color-text-inverse);
  outline: 2px dashed var(--color-accent);
  outline-offset: -2px;
}

.item-icon {
  flex-shrink: 0;
}

.item-name {
  flex: 1;
  font-size: var(--text-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 计数标签 */
.item-count {
  display: inline-flex;
  align-items: center;
  height: 24px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  padding: 0 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

/* 操作按钮组：常亮显示 */
.item-actions {
  display: flex;
  flex-shrink: 0;
}

.more-menu-wrapper {
  position: relative;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.action-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-text-inverse);
}
.action-btn:active {
  transform: scale(0.97);
}
.action-btn.danger:hover {
  background: rgba(var(--color-danger-rgb), 0.2);
  color: var(--color-danger);
}

/* 三点按钮：常亮，激活态高亮 */
.more-btn.active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-text-inverse);
}

/* 二级菜单浮层：绝对定位，右侧弹出 */
.more-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-1);
  min-width: 120px;
  z-index: var(--z-tooltip);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  cursor: pointer;
  text-align: left;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}
.menu-item:hover {
  background: var(--color-bg-subtle);
}
.menu-item.danger {
  color: var(--color-danger);
}
.menu-item.danger:hover {
  background: rgba(var(--color-danger-rgb), 0.12);
}

/* 菜单过渡动画 */
.menu-enter-active,
.menu-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 编辑模式 */
.edit-mode {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px 8px;
}

.edit-input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  color: var(--color-text-inverse);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  outline: none;
}
.edit-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.2);
}
.edit-input::selection {
  color: var(--color-text-inverse);
  background-color: rgba(var(--color-accent-rgb), 0.3);
}

.edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.edit-btn:active {
  transform: scale(0.97);
}
.edit-btn.confirm {
  background: var(--color-accent);
  color: var(--color-text-inverse);
}
.edit-btn.confirm:hover {
  background: var(--color-accent-hover);
}
.edit-btn.cancel {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}
.edit-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-text-inverse);
}
</style>
