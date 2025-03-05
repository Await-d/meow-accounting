# 家庭记账系统

一个基于React和Node.js的家庭记账系统，支持多用户、多家庭的账单管理。

## 功能特性

- 用户认证和授权
- 家庭成员管理
- 交易记录管理
- 分类统计
- CSV导入导出
- 实时通知

## API变更记录

### 2024-03-05

1. 认证机制更新
- 所有API请求现在通过统一的`fetchAPI`函数发送
- 自动添加token到请求头
- 统一的错误处理机制

2. 家庭管理API优化
- 重构所有家庭相关API函数
- 添加了权限控制
- 支持成员角色管理

3. 统计API更新
- 添加了默认的时间范围设置
- 支持按分类统计
- 支持自定义时间范围查询

## 开发指南

### 环境要求

- Node.js >= 18
- MySQL >= 8.0
- TypeScript >= 5.0

### 安装

1. 克隆仓库
```bash
git clone [repository-url]
```

2. 安装依赖
```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

3. 配置环境变量
```bash
# backend/.env
DATABASE_URL=mysql://user:password@localhost:3306/bill
JWT_SECRET=your-secret-key

# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. 启动开发服务器
```bash
# 后端
npm run dev

# 前端
npm run dev
```

### API文档

#### 认证API

- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录

#### 家庭API

- GET /api/families/user - 获取用户的家庭列表
- POST /api/families - 创建新家庭
- GET /api/families/:id - 获取家庭详情
- GET /api/families/:id/members - 获取家庭成员
- POST /api/families/:id/members - 添加家庭成员
- PUT /api/families/:id/members/:userId/role - 更新成员角色
- DELETE /api/families/:id/members/:userId - 移除家庭成员

#### 交易API

- GET /api/transactions - 获取交易列表
- POST /api/transactions - 创建新交易
- PUT /api/transactions/:id - 更新交易
- DELETE /api/transactions/:id - 删除交易

#### 分类API

- GET /api/categories - 获取分类列表
- POST /api/categories - 创建新分类

#### 统计API

- GET /api/statistics - 获取统计数据
- GET /api/statistics/categories - 获取分类统计

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License 