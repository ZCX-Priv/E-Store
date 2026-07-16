<script setup lang="ts">
// 全局 Toast 通知渲染器 - 顶部居中，多条向下堆叠
import { CheckCircle2, XCircle, Info, X } from 'lucide-vue-next'
import type { Component } from 'vue'
import { useToast, type ToastType } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

// 各类型对应图标
const iconMap: Record<ToastType, Component> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup
      name="toast"
      tag="div"
      class="toast-region"
      aria-live="polite"
      aria-atomic="false"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        <component :is="iconMap[toast.type]" :size="20" class="toast-icon" />
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="dismiss(toast.id)" aria-label="关闭">
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
/* 通知容器：顶部居中，纵向堆叠 */
.toast-region {
  position: fixed;
  top: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  width: max-content;
  max-width: calc(100vw - var(--space-8));
  /* 容器本身不拦截点击，仅单条 toast 可交互 */
  pointer-events: none;
}

/* 单条 toast */
.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 260px;
  max-width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  /* 左侧 3px 强调条，颜色随类型变化 */
  border-left: 3px solid var(--toast-color);
}

/* 三态配色：success 翡翠 / error 朱红 / info 天蓝 */
.toast-success {
  --toast-color: var(--color-accent);
  --toast-color-rgb: var(--color-accent-rgb);
}
.toast-error {
  --toast-color: var(--color-danger);
  --toast-color-rgb: var(--color-danger-rgb);
}
.toast-info {
  --toast-color: var(--color-info);
  --toast-color-rgb: var(--color-info-rgb);
}

/* 图标：着色 + 淡色圆形背景 */
.toast-icon {
  flex-shrink: 0;
  color: var(--toast-color);
}

.toast-message {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: var(--leading-normal);
  word-break: break-word;
}

/* 关闭按钮 */
.toast-close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}
.toast-close:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}
.toast-close:active {
  transform: scale(0.94);
}

/* 过渡：自顶部下滑 + 淡入，离场淡出 */
.toast-enter-active {
  transition: opacity var(--duration-normal) var(--ease-out),
              transform var(--spring-response) var(--ease-out);
}
.toast-leave-active {
  transition: opacity var(--duration-normal) var(--ease-out),
              transform var(--duration-normal) var(--ease-out);
  /* 离场脱离文档流，配合 move 实现平滑回填 */
  position: absolute;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
/* 堆叠回流动画：某条移除后其余平滑上移 */
.toast-move {
  transition: transform var(--duration-normal) var(--ease-out);
}

/* 减少动效偏好：降级为纯透明度过渡 */
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: opacity var(--duration-normal) ease;
  }
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>
