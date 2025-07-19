# 喵呜记账项目结构

项目采用前后端分离架构，主要分为以下几个部分：

```
meow-accounting/
  - backend/       # Express后端服务
  - frontend/      # Next.js前端应用
  - docs/          # 项目文档
  - Dockerfile     # Docker配置
  - start.sh       # 启动脚本
```

## 后端结构 (backend/)

后端使用Express框架，采用MVC架构：

```
backend/
  - src/
    - app.ts              # 应用入口文件
    - controllers/        # 控制器目录，处理请求逻辑
    - models/             # 数据模型目录，定义数据结构和操作
    - routes/             # 路由目录，定义API端点
    - middleware/         # 中间件目录
    - config/             # 配置文件目录
    - utils/              # 工具函数目录
    - types/              # TypeScript类型定义
    - validators/         # 数据验证器
  - package.json          # 依赖和脚本定义
  - tsconfig.json         # TypeScript配置
```

主要功能模块：
- 用户认证管理 (auth)
- 家庭管理 (family)
- 分类管理 (category)
- 交易记录 (transaction)
- 账户管理 (account)
- 统计报表 (statistics)

## 前端结构 (frontend/)

前端使用Next.js框架，采用App Router架构：

```
frontend/
  - src/
    - app/                # 页面和路由目录
      - page.tsx          # 首页
      - auth/             # 认证相关页面
      - dashboard/        # 仪表盘页面
      - transactions/     # 交易管理页面
      - settings/         # 设置页面
      - statistics/       # 统计分析页面
    - components/         # 可复用组件
      - ui/               # UI基础组件
      - dashboard/        # 仪表盘组件
      - transactions/     # 交易相关组件
    - hooks/              # 自定义React hooks
    - utils/              # 工具函数
    - lib/                # 通用库
    - config/             # 配置
  - public/               # 静态资源
  - package.json          # 依赖和脚本定义
  - next.config.js        # Next.js配置
  - tailwind.config.js    # Tailwind CSS配置
```

## 重要文件

- `backend/src/app.ts` - 后端应用入口
- `frontend/src/app/page.tsx` - 前端主页
- `Dockerfile` - 容器化配置
- `start.sh` - 启动脚本
- `.env.example` - 环境变量模板