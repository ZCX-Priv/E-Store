# E-Store 库存管理系统

基于 Vue 3 + TypeScript + Vite + IndexedDB 的本地库存管理工具。

## 功能特性

- 库存项管理：支持添加、编辑、删除库存项
- 分类管理：支持自定义分类，拖拽调整排序
- 视图切换：网格视图与列表视图自由切换
- 虚拟滚动：列表视图超过 100 条数据时自动启用，优化性能
- Excel 导入导出：支持批量导入导出库存数据
- 低库存警示：自定义低库存阈值，低于阈值时高亮警示
- 主题模式：支持白昼、夜间、跟随系统三种模式
- 响应式设计：适配桌面端、平板和移动端
- 可安装：支持安装到桌面/主屏幕，完全离线可用，自动更新

## 技术栈

- Vue 3.5 + TypeScript
- Vite 8.1
- Pinia 3.0（状态管理）
- Dexie 4.4（IndexedDB 封装）
- VueUse 14.3（工具库）
- Lucide Vue Next（图标库）
- vue-draggable-plus（拖拽排序）
- xlsx（Excel 处理）

## 项目结构

```
src/
├── components/          # 组件目录
│   ├── common/         # 通用组件
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

## 快速开始

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

### 生成应用图标

修改 `public/icon-source.svg` 后重新生成所有尺寸的应用图标：

```bash
npm run gen-pwa-assets
```

## 数据存储

系统使用浏览器内置的 IndexedDB 进行本地数据存储，所有数据保存在用户设备上，无需后端服务。

## License

MIT