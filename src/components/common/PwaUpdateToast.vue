<script setup lang="ts">
// PWA Service Worker 更新提示组件
// 监听 vite-plugin-pwa 的 SW 更新事件，新版本就绪后弹出 Toast 提示用户刷新
import { ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { RefreshCw, X } from 'lucide-vue-next'

// 是否需要刷新（新版本已就绪）
const needRefresh = ref(false)

// 注册 SW，监听 onNeedRefresh 回调
const { updateServiceWorker } = useRegisterSW({
  onNeedRefresh() {
    needRefresh.value = true
  },
  onOfflineReady() {
    // 离线就绪：可静默处理，不打扰用户
    // 如需提示可在此处触发 toast
  },
})

// 用户点击"立即刷新"：拉取最新 SW 并重载页面
async function handleUpdate() {
  await updateServiceWorker(true)
}

// 用户点击"关闭"：本次忽略，下次访问自动生效
function handleClose() {
  needRefresh.value = false
}
</script>

<template>
  <Transition name="pwa-toast">
    <div v-if="needRefresh" class="pwa-toast" role="alert">
      <div class="pwa-toast__icon">
        <RefreshCw :size="18" />
      </div>
      <div class="pwa-toast__content">
        <span class="pwa-toast__title">新版本已就绪</span>
        <span class="pwa-toast__desc">刷新页面以获取最新版本</span>
      </div>
      <button class="pwa-toast__btn pwa-toast__btn--primary" @click="handleUpdate">
        刷新
      </button>
      <button class="pwa-toast__btn pwa-toast__btn--ghost" :aria-label="'关闭'" @click="handleClose">
        <X :size="16" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.pwa-toast {
  position: fixed;
  right: var(--space-4, 1rem);
  bottom: var(--space-4, 1rem);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: var(--space-3, 0.75rem);
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  background: var(--color-bg-elevated, #ffffff);
  border: 1px solid var(--color-border, #e7e5e4);
  border-radius: var(--radius-lg, 0.75rem);
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  max-width: 360px;
}

[data-theme='dark'] .pwa-toast {
  background: var(--color-bg-elevated, #1e293b);
  border-color: var(--color-border, #334155);
}

.pwa-toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full, 9999px);
  background: var(--color-accent, #10b981);
  color: #ffffff;
  flex-shrink: 0;
}

.pwa-toast__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.pwa-toast__title {
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--weight-semibold, 600);
  color: var(--color-text, #1c1917);
}

.pwa-toast__desc {
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-secondary, #78716c);
}

.pwa-toast__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--weight-medium, 500);
  border-radius: var(--radius-md, 0.5rem);
  transition: background-color var(--duration-fast, 150ms) var(--ease-out);
}

.pwa-toast__btn--primary {
  padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
  background: var(--color-accent, #10b981);
  color: #ffffff;
}

.pwa-toast__btn--primary:hover {
  background: var(--color-accent-hover, #059669);
}

.pwa-toast__btn--ghost {
  padding: var(--space-2, 0.5rem);
  background: transparent;
  color: var(--color-text-secondary, #78716c);
}

.pwa-toast__btn--ghost:hover {
  background: var(--color-bg-subtle, #f5f4f2);
  color: var(--color-text, #1c1917);
}

/* 进出过渡 */
.pwa-toast-enter-active,
.pwa-toast-leave-active {
  transition:
    transform var(--duration-normal, 250ms) var(--ease-out),
    opacity var(--duration-normal, 250ms) var(--ease-out);
}

.pwa-toast-enter-from,
.pwa-toast-leave-to {
  transform: translateY(16px);
  opacity: 0;
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .pwa-toast-enter-active,
  .pwa-toast-leave-active {
    transition: opacity var(--duration-normal, 250ms) ease;
  }
}
</style>
