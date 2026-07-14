import { useMediaQuery } from '@vueuse/core'

// 响应式断点工具
export function useBreakpoint() {
  // 桌面端：>= 1024px
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  // 平板端：768px - 1023px
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  // 手机端：< 768px
  const isMobile = useMediaQuery('(max-width: 767px)')
  // 平板及以上（非手机）
  const isTabletUp = useMediaQuery('(min-width: 768px)')

  return { isDesktop, isTablet, isMobile, isTabletUp }
}
