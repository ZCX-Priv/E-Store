import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// PWA 图标生成配置
// 从 public/icon-source.svg 生成所有平台所需尺寸的图标
export default defineConfig({
  // 输入源 SVG
  images: ['public/icon-source.svg'],
  // 预设：minimal 2023（覆盖 PNG + maskable + apple-touch-icon + favicon）
  preset: {
    ...minimal2023Preset,
    // 透明背景（前景 SVG 已自带圆角背景，无需再叠一层）
    transparent: {
      sizes: [192, 512],
      favicons: [[48, 'favicon.ico']],
    },
    maskable: {
      sizes: [512],
      // maskable 图标需在内边距安全区内，padding 略大避免 Android 裁剪到内容
      padding: 0.2,
      resizeOptions: { background: '#10b981' },
    },
    png: {
      sizes: [192, 512],
      favicons: [[48, 'favicon.ico']],
    },
  },
})
