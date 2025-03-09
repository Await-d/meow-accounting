# 喵呜记账 - 后端

一个现代化的家庭记账应用的后端服务，提供完整的API支持。

## 功能特点

- 🔑 用户认证
  - JWT认证
  - 刷新令牌
  - 会话管理

- 👨‍👩‍👧‍👦 家庭管理
  - 家庭创建与管理
  - 成员邀请系统
  - 权限控制

- 💰 账单管理
  - 收支记录
  - 分类管理
  - 统计分析

- 🛣️ 路由管理
  - 个人路由管理
  - 家庭路由管理
  - 权限级别控制
  - 路由状态管理

## 技术栈

- Node.js
- Express
- TypeScript
- SQLite3
- JWT

## API文档

### 路由管理API

#### 获取路由列表

```http
GET /api/routes/user/routes
GET /api/routes/family/:familyId/routes
```

#### 创建路由

```http
POST /api/routes
Content-Type: application/json

{
  "path": "/dashboard",
  "name": "仪表盘",
  "description": "仪表盘页面",
  "permission": "private",
  "family_id": null
}
```

#### 更新路由

```http
PUT /api/routes/:id
Content-Type: application/json

{
  "name": "新名称",
  "description": "新描述",
  "permission": "public",
  "is_active": true
}
```

#### 删除路由

```http
DELETE /api/routes/:id
```

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
backend/
├── src/
│   ├── controllers/     # 控制器
│   ├── models/         # 数据模型
│   ├── routes/         # 路由定义
│   ├── middleware/     # 中间件
│   └── types/          # 类型定义
├── database.sqlite     # SQLite数据库
└── package.json        # 项目配置
```

## 最近更新

### 路由管理功能 (2025-03-09)

- 新增路由管理API
  - 支持个人和家庭路由的CRUD操作
  - 实现路由权限控制
  - 添加路由状态管理

- 数据库更新
  - 新增routes表
  - 添加路由权限和状态字段
  - 优化查询性能

- 安全性改进
  - 增强路由访问控制
  - 添加请求验证
  - 优化错误处理

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

MIT License 