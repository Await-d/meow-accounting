# 喵呜记账 前端项目

## 项目介绍

喵呜记账是一个现代化的家庭记账应用，帮助用户轻松管理个人和家庭财务。

## 主要功能

- 用户认证与授权
- 个人和家庭账单管理
- 收支分类管理
- 数据统计与分析
- 家庭成员管理
- 动态路由管理

## 技术栈

- Next.js 14
- React 18
- TypeScript
- NextUI
- TanStack Query
- Tailwind CSS
- Framer Motion

## 动态路由系统

### 功能特点

- 支持用户自定义路由
- 基于角色的路由权限控制
- 动态组件加载
- 路由缓存和预加载
- 自定义默认路由设置

### 路由类型

- 仪表盘路由
- 交易记录路由
- 统计分析路由
- 设置路由
- 自定义路由

### 权限级别

- 公开：所有用户可访问
- 私有：仅创建者可访问
- 家庭：仅家庭成员可访问
- 管理员：仅家庭管理员可访问

### 使用示例

```typescript
// 设置默认路由
await updateSettings({
    default_route: '/dashboard',
    privacy_mode: false
});

// 创建自定义路由
await createRoute({
    path: '/my-dashboard',
    name: '我的仪表盘',
    type: RouteType.DASHBOARD,
    permission: RoutePermission.PRIVATE
});

// 导航到指定路由
await navigateToRoute(route);
```

## 开发指南

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 启动生产服务

```bash
npm start
```

## 项目结构

```
src/
  ├── app/           # 页面组件
  ├── components/    # 通用组件
  ├── config/        # 配置文件
  ├── hooks/         # 自定义 Hooks
  ├── lib/          # 工具函数和类型定义
  ├── providers/    # 上下文提供者
  └── utils/        # 辅助函数
```

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT 