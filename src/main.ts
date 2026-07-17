import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import './styles/variables.css'
import './styles/base.css'
import './styles/animations.css'

/**
 * 运行时动态设置需要绝对 URL 的 SEO meta 标签
 * 不写死域名，自动检测当前部署地址
 * - canonical / og:url / og:image / twitter:image / JSON-LD url
 */
function setupDynamicSeo(): void {
  const origin = window.location.origin
  const fullUrl = window.location.href.split('#')[0]
  const ogImageUrl = `${origin}/pwa-512x512.png`

  // canonical
  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', fullUrl)

  // og:url
  let ogUrl = document.head.querySelector('meta[property="og:url"]')
  if (!ogUrl) {
    ogUrl = document.createElement('meta')
    ogUrl.setAttribute('property', 'og:url')
    document.head.appendChild(ogUrl)
  }
  ogUrl.setAttribute('content', fullUrl)

  // og:image
  let ogImage = document.head.querySelector('meta[property="og:image"]')
  if (!ogImage) {
    ogImage = document.createElement('meta')
    ogImage.setAttribute('property', 'og:image')
    document.head.appendChild(ogImage)
  }
  ogImage.setAttribute('content', ogImageUrl)

  // twitter:image
  let twitterImage = document.head.querySelector('meta[name="twitter:image"]')
  if (!twitterImage) {
    twitterImage = document.createElement('meta')
    twitterImage.setAttribute('name', 'twitter:image')
    document.head.appendChild(twitterImage)
  }
  twitterImage.setAttribute('content', ogImageUrl)

  // JSON-LD url 动态修正为当前完整 URL
  const ldScript = document.head.querySelector('script[type="application/ld+json"]')
  if (ldScript?.textContent) {
    try {
      const data = JSON.parse(ldScript.textContent)
      data.url = fullUrl
      if (data.screenshot && !data.screenshot.startsWith('http')) {
        data.screenshot = `${origin}${data.screenshot}`
      }
      ldScript.textContent = JSON.stringify(data)
    } catch {
      // JSON-LD 解析失败，忽略（不影响应用运行）
    }
  }
}

setupDynamicSeo()

// 创建应用实例并注册插件
const app = createApp(App)
app.use(createPinia())
app.use(MotionPlugin)
app.mount('#app')
