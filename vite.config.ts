import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Vite 配置：库存管理系统（可安装 / 离线可用）
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // 自动更新：新版本 SW 接管后下次刷新生效
      injectRegister: 'auto', // 自动注入 SW 注册代码
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon-source.svg'],
      manifest: {
        name: 'E-Store',
        short_name: 'E-Store',
        description:
          'E-Store 是一款基于浏览器的本地库存管理工具，支持库存分类管理、Excel 批量导入导出、低库存预警、虚拟滚动、多主题模式，数据完全离线存储于 IndexedDB，可安装到桌面与手机主屏幕，安装后完全离线可用，无需后端服务。',
        lang: 'zh-CN',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone', // 独立窗口，无浏览器 chrome
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any', // 允许任意方向
        background_color: '#faf9f7',
        theme_color: '#10b981',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 预缓存所有静态资源，保证应用 Shell 完整离线可用
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // SPA navigateFallback：所有导航请求回退到 index.html，离线刷新不会 404
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//], // 预留：本项目无 API，仅作防御
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // 字体运行时缓存（CacheFirst，长期缓存）
        runtimeCaching: [
          {
            urlPattern: /\.(?:woff2?|ttf|otf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // 开发环境也启用 SW，便于调试
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 依赖分包：将大型/稳定的第三方库拆为独立长缓存 chunk，
        // 应用代码更新时不会使这些 vendor 缓存失效，提升复访命中率。
        // xlsx 已由动态 import 自动拆分为按需异步 chunk。
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('xlsx')) return 'xlsx'
          if (id.includes('dexie')) return 'vendor-dexie'
          if (id.includes('sortablejs') || id.includes('vue-draggable-plus')) return 'vendor-dnd'
          if (id.includes('lucide')) return 'vendor-icons'
          if (id.includes('@vueuse')) return 'vendor-vueuse'
          if (id.includes('/vue/') || id.includes('/@vue/') || id.includes('pinia')) return 'vendor-vue'
          return 'vendor'
        },
      },
    },
  },
})
