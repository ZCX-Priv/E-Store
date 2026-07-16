<script setup lang="ts">
// 通用确认对话框 - Apple 风格，从中心缩放展开
import { AlertTriangle } from 'lucide-vue-next'

withDefaults(defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}>(), {
  confirmText: '确认',
  cancelText: '取消',
  danger: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="show" class="confirm-overlay">
        <div class="confirm-dialog" :class="{ danger }" role="dialog" aria-modal="true" :aria-label="title">
          <!-- 危险操作图标 -->
          <div v-if="danger" class="confirm-icon">
            <AlertTriangle :size="24" />
          </div>

          <!-- 标题 -->
          <h3 class="confirm-title">{{ title }}</h3>

          <!-- 消息内容 -->
          <p class="confirm-message">{{ message }}</p>

          <!-- 操作按钮 -->
          <div class="confirm-actions">
            <button class="btn-cancel" @click="emit('cancel')">
              {{ cancelText }}
            </button>
            <button class="btn-confirm" :class="{ danger }" @click="emit('confirm')">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 遮罩层：毛玻璃效果 */
.confirm-overlay {
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

/* 对话框主体 */
.confirm-dialog {
  z-index: var(--z-modal);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-2xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* 危险操作图标：朱红圆形背景 */
.confirm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: rgba(var(--color-danger-rgb), 0.12);
  color: var(--color-danger);
  margin-bottom: var(--space-4);
}

.confirm-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--space-2) 0;
}

.confirm-message {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0 0 var(--space-6) 0;
}

/* 按钮组 */
.confirm-actions {
  display: flex;
  gap: var(--space-3);
  width: 100%;
}

/* 取消按钮 */
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
.btn-cancel:hover {
  background: var(--color-border);
}
.btn-cancel:active {
  transform: scale(0.97);
}

/* 确认按钮：默认翡翠绿，danger 时朱红 */
.btn-confirm {
  flex: 1;
  padding: var(--space-3) var(--space-4);
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
.btn-confirm:hover {
  background: var(--color-accent-hover);
}
.btn-confirm:active {
  transform: scale(0.97);
}
.btn-confirm.danger {
  background: var(--color-danger);
}
.btn-confirm.danger:hover {
  background: var(--color-danger-hover);
}

/* 过渡动画：遮罩淡入淡出 + 对话框缩放 */
.confirm-enter-active,
.confirm-leave-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}
.confirm-enter-active .confirm-dialog,
.confirm-leave-active .confirm-dialog {
  transition: transform var(--spring-response) var(--ease-out),
              opacity var(--duration-normal) var(--ease-out);
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
.confirm-enter-from .confirm-dialog,
.confirm-leave-to .confirm-dialog {
  transform: scale(0.92);
  opacity: 0;
}
</style>
