import { ref, readonly } from 'vue'

// Toast 通知类型：success 成功 / error 失败 / info 提示
export type ToastType = 'success' | 'error' | 'info'

// 单条 Toast 数据
export interface ToastItem {
  id: number
  type: ToastType
  message: string
  duration: number
}

// 各类型默认展示时长（毫秒）：失败停留更久，便于阅读
const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  info: 3000,
  error: 4000,
}

// 同时展示的最大条数，超出移除最早一条
const MAX_TOASTS = 4

// ========== 模块级单例状态（跨组件共享，可在任意位置调用） ==========
const toasts = ref<ToastItem[]>([])
// 自动消失定时器，按 id 记录以便手动关闭时清理
const timers = new Map<number, ReturnType<typeof setTimeout>>()
// 自增 id 种子
let seed = 0

// 移除指定 Toast，并清理其定时器
function dismiss(id: number) {
  const timer = timers.get(id)
  if (timer !== undefined) {
    clearTimeout(timer)
    timers.delete(id)
  }
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

// 入队一条 Toast，返回其 id
function show(message: string, type: ToastType = 'info', duration?: number): number {
  const id = ++seed
  const finalDuration = duration ?? DEFAULT_DURATION[type]

  toasts.value.push({ id, type, message, duration: finalDuration })

  // 超出上限时移除最早一条
  if (toasts.value.length > MAX_TOASTS) {
    dismiss(toasts.value[0].id)
  }

  // duration <= 0 表示不自动消失（需手动关闭）
  if (finalDuration > 0) {
    const timer = setTimeout(() => dismiss(id), finalDuration)
    timers.set(id, timer)
  }

  return id
}

// Toast 服务：提供三态便捷方法与手动关闭
export function useToast() {
  return {
    // 只读列表，供渲染组件订阅
    toasts: readonly(toasts),
    show,
    success: (message: string, duration?: number) => show(message, 'success', duration),
    error: (message: string, duration?: number) => show(message, 'error', duration),
    info: (message: string, duration?: number) => show(message, 'info', duration),
    dismiss,
  }
}
