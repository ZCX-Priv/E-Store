# E-Store 库存管理系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Vue 3.5](https://img.shields.io/badge/Vue-3.5-42b883.svg)](https://vuejs.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8.svg)](https://web.dev/progressive-web-apps/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](https://www.typescriptlang.org/)

> 基于浏览器的本地库存管理工具，数据存储在 IndexedDB，不上云、可离线、可安装。

## 简介

E-Store 是一款基于 Vue 3 + TypeScript + Vite + IndexedDB 的本地库存管理工具，纯前端 PWA 应用，无需后端服务，可离线使用、可安装到桌面与手机主屏幕。

核心卖点：

- **隐私安全**：数据完全存储在用户设备的浏览器 IndexedDB 中，不上云、不联网，杜绝隐私泄露
- **离线可用**：Service Worker 预缓存所有静态资源，安装后完全离线可用
- **可安装**：通过 PWA manifest 可安装到桌面/手机主屏幕，体验接近原生应用
- **跨平台**：响应式设计，适配桌面端、平板与移动端

GitHub 仓库：[ZCX-Priv/E-Store](https://github.com/ZCX-Priv/E-Store)

## 功能特性

- **库存项管理**：支持添加、编辑、删除库存项，记录名称、数量、单位、价格、描述等字段
- **分类管理**：支持自定义分类，分类内拖拽排序，跨分类拖拽库存项
- **未分类支持**：库存项可不归属任何分类，侧边栏独立显示"未分类"计数
- **视图切换**：网格视图与列表视图自由切换
- **虚拟滚动**：列表视图超过 100 条数据时自动启用，优化大数据量渲染性能
- **Excel 导入导出**：支持 `.xlsx` 格式批量导入导出库存数据
- **低库存警示**：每项可自定义低库存阈值，低于阈值时高亮警示
- **主题模式**：支持白昼、夜间、跟随系统三种模式
- **响应式设计**：适配桌面端、平板和移动端
- **PWA 支持**：可安装到桌面/主屏幕，完全离线可用，Service Worker 自动注册并提示更新

## 技术栈

### 核心框架

- Vue 3.5 + TypeScript ~6.0（strict 模式）
- Vite 8.1（构建工具与开发服务器）

### 状态与数据

- Pinia 3.0（UI 状态管理，持久化到 localStorage）
- Dexie 4.4（IndexedDB 封装，liveQuery 响应式驱动）

### UI 与交互

- VueUse 14.3（工具库）
- Lucide Vue Next 0.577（图标库）
- vue-draggable-plus 0.6（拖拽排序）

### 数据处理

- xlsx 0.18.5（Excel 导入导出，异步加载独立 chunk）

### PWA

- vite-plugin-pwa 1.3（Service Worker 自动注册 + Workbox 预缓存）
- @vite-pwa/assets-generator 1.0（PWA 图标生成）

## 技术特点

- **本地优先架构**：所有数据存储在用户设备 IndexedDB，无任何网络请求依赖，隐私安全
- **Repository 模式**：数据访问层抽象（`src/db/repositories/`），业务逻辑与 UI 解耦
- **Composition API**：逻辑复用通过 `useXxx` 组合式函数（`src/composables/`），Pinia 仅管理 UI 状态，数据层由 Dexie liveQuery 驱动响应式
- **严格 TypeScript**：`strict: true` + `noUnusedLocals/Parameters`，禁止 `any` 类型
- **构建分包优化**：xlsx、dexie、拖拽库、图标库、VueUse、Vue 核心分别独立 chunk，优化首屏加载

## 项目结构

```
src/
├── components/          # 组件目录
│   ├── common/         # 通用组件（Toast / Dialog / PWA 提示）
│   ├── inventory/      # 库存相关组件
│   ├── layout/         # 布局组件
│   ├── settings/       # 设置页面组件
│   └── sidebar/        # 侧边栏组件
├── composables/        # 组合式函数
├── db/                 # 数据库相关
│   ├── repositories/   # 数据访问层
│   ├── database.ts     # 数据库定义
│   └── types.ts        # 类型定义
├── stores/             # Pinia 状态管理
├── styles/             # 全局样式
├── utils/              # 工具函数
├── App.vue             # 根组件
└── main.ts             # 入口文件
```

### 根级配置文件

| 文件 | 用途 |
|------|------|
| `vite.config.ts` | Vite + Vue + PWA 插件配置，`@` 路径别名，manualChunks 分包 |
| `tsconfig.json` | TypeScript 项目引用根配置 |
| `tsconfig.app.json` | 应用代码 TS 配置（strict 模式） |
| `tsconfig.node.json` | Node 端配置（仅 vite.config.ts） |
| `pwa-assets.config.ts` | PWA 图标生成配置 |
| `index.html` | HTML 入口（含完整 SEO / Open Graph / JSON-LD） |

## 快速开始

### 环境要求

- Node.js（建议 LTS 版本）
- npm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

### 生成 PWA 图标

修改 `public/icon-source.svg` 后重新生成所有尺寸的 PWA 图标：

```bash
npm run gen-pwa-assets
```

## 数据存储

系统使用浏览器内置的 IndexedDB 进行本地数据存储（通过 Dexie 封装），所有数据保存在用户设备上，无需后端服务，不上云。

- 数据库：`InventoryDB`，包含 `categories`（分类）和 `items`（库存项）两张表
- Schema 版本：v2（含低库存预警字段）
- 清空浏览器数据即清空所有库存数据，请注意备份（可通过 Excel 导出）

## 适用场景

- 小型商店/电商卖家库存管理
- 个人物品/收藏品管理
- 仓库/办公室物资管理
- 任何需要本地离线库存管理的场景

## 部署

E-Store 是纯静态前端应用，构建产物可托管到任何静态托管服务：

1. 执行 `npm run build`，生成 `dist/` 目录
2. 将 `dist/` 部署到：
   - GitHub Pages
   - Vercel
   - Netlify
   - Cloudflare Pages
   - 或任何支持静态文件的 Web 服务器

> 注意：作为 PWA，部署时需确保 Service Worker（`sw.js`）与 `manifest.webmanifest` 可正常访问，且 HTTPS 是 PWA 安装的硬性要求。

## License

本项目依据 [MIT](./LICENSE) 协议开源，Copyright © 2026 SOLO-Thinker。
