// localStorage 安全封装
// 隐私模式、超出配额或被浏览器策略禁用时，直接读写 localStorage 会抛异常，
// 这里统一兜底，避免因持久化失败导致 UI 交互（切视图/选分类等）中断。

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 忽略：持久化失败不影响当前会话的内存态
  }
}
