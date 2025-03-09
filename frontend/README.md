# 喵呜记账 - 前端

一个现代化的家庭记账应用，帮助家庭成员共同管理财务。

## 功能特点

- 📊 收支记录与统计
  - 记录日常收入和支出
  - 自定义分类管理
  - 图表数据分析

- 👨‍👩‍👧‍👦 家庭管理
  - 创建和管理家庭组
  - 邀请家庭成员
  - 设置成员权限

- 🔐 路由管理
  - 个人路由和家庭路由
  - 灵活的权限控制
  - 路由状态管理
  - 搜索和筛选功能

- 🎨 现代化界面
  - 响应式设计
  - 暗色模式支持
  - 流畅的动画效果

## 技术栈

- Next.js 14
- TypeScript
- NextUI
- TailwindCSS
- React Query

## 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 项目结构

```
frontend/
├── src/
│   ├── app/              # 页面组件
│   ├── components/       # 通用组件
│   ├── hooks/           # 自定义Hooks
│   ├── lib/             # 工具函数和类型定义
│   └── styles/          # 样式文件
├── public/              # 静态资源
└── package.json         # 项目配置
```

## 最近更新

### 路由管理功能 (2025-03-09)

- 新增路由管理页面
  - 支持创建和管理个人路由
  - 支持创建和管理家庭路由
  - 提供路由权限控制
  - 添加路由搜索和筛选功能
  - 支持路由状态管理（启用/禁用）

- 权限控制优化
  - 路由管理页面仅管理员可访问
  - 路由创建者可管理路由
  - 其他成员仅可查看

- 用户体验改进
  - 添加路由列表排序功能
  - 优化路由详情展示
  - 添加加载状态提示

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

MIT License 