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
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  max-width: 360px;
}

.pwa-toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: var(--color-text-inverse);
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
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}

.pwa-toast__desc {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.pwa-toast__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  border-radius: var(--radius-md);
  transition: background-color var(--duration-fast) var(--ease-out);
}

.pwa-toast__btn--primary {
  padding: var(--space-2) var(--space-3);
  background: var(--color-accent);
  color: var(--color-text-inverse);
}

.pwa-toast__btn--primary:hover {
  background: var(--color-accent-hover);
}

.pwa-toast__btn--ghost {
  padding: var(--space-2);
  background: transparent;
  color: var(--color-text-secondary);
}

.pwa-toast__btn--ghost:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

/* 进出过渡 */
.pwa-toast-enter-active,
.pwa-toast-leave-active {
  transition:
    transform var(--duration-normal) var(--ease-out),
    opacity var(--duration-normal) var(--ease-out);
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
    transition: opacity var(--duration-normal) ease;
  }
}
</style>
