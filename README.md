# 快速记账

一个简单易用的个人记账应用，支持收支记录、分类统计和数据可视化。支持移动端和平板设备。

## 功能特点

- 📝 快速记账：支持收入和支出记录
- 📊 数据统计：直观展示收支情况
- 📅 时间管理：按日期查看和统计
- 🏷️ 分类管理：自定义收支分类
- 📱 响应式设计：完美适配手机、平板和桌面端
- 💾 本地存储：数据保存在本地SQLite数据库
- 🚀 PWA支持：可安装到移动设备

## 技术栈

### 前端

- Next.js 14
- TypeScript
- NextUI
- TailwindCSS
- Chart.js
- Dayjs

### 后端

- Node.js
- Express
- TypeScript
- SQLite3
- PM2
- Winston

## 系统要求

- Node.js 16.x 或更高版本
- NPM 7.x 或更高版本
- SQLite3

## 项目结构

```
bill-app/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── app/           # 页面组件
│   │   │   └── globals.css # 全局样式
│   │   ├── components/    # 通用组件
│   │   └── utils/        # 工具函数
│   └── public/           # 静态资源
└── backend/              # 后端项目
    ├── src/
    │   ├── controllers/  # 控制器
    │   ├── models/      # 数据模型
    │   ├── routes/      # 路由
    │   └── utils/       # 工具函数
    ├── logs/           # 日志文件
    └── database/        # SQLite数据库
```

## 安装和运行

### 1. 克隆项目

```bash
git clone [项目地址]
cd bill-app
```

### 2. 后端设置

```bash
cd backend
npm install
npm install -g pm2  # 全局安装PM2

# 开发环境
npm run dev

# 生产环境
npm run build
npm start  # 使用PM2启动服务
```

后端服务将在 http://localhost:3001 运行

PM2 常用命令：
- `npm run logs` - 查看日志
- `npm run stop` - 停止服务
- `npm run restart` - 重启服务

### 3. 前端设置

```bash
cd frontend
npm install
npm run dev  # 开发环境
npm run build  # 生产环境构建
npm start  # 生产环境运行
```

前端应用将在 http://localhost:3000 运行

## 移动端适配

### 响应式设计

- 自适应布局：适配不同屏幕尺寸
- 触摸优化：适合手指操作的按钮和表单
- 底部快捷操作：移动端特有的快速记账按钮
- 顶部固定导航：方便单手操作

### iPad优化

- 双列布局：充分利用屏幕空间
- 手势支持：支持滑动操作
- 键盘优化：支持外接键盘快捷操作

### PWA支持

1. 安装到主屏幕
   - iOS：使用Safari浏览器访问 -> 分享 -> 添加到主屏幕
   - Android：使用Chrome访问 -> 菜单 -> 添加到主屏幕

2. 离线支持
   - 基本功能可离线使用
   - 数据会在联网后自动同步

## API文档

### 分类管理

#### 获取所有分类
- GET `/api/categories`
- 响应：分类列表

#### 创建分类
- POST `/api/categories`
- 请求体：
```json
{
  "name": "分类名称",
  "type": "income|expense",
  "icon": "emoji图标"
}
```

#### 更新分类
- PUT `/api/categories/:id`
- 请求体：同创建分类

#### 删除分类
- DELETE `/api/categories/:id`

### 交易记录

#### 获取所有交易
- GET `/api/transactions`
- 响应：交易记录列表

#### 按日期范围获取交易
- GET `/api/transactions/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

#### 创建交易
- POST `/api/transactions`
- 请求体：
```json
{
  "amount": 100,
  "type": "income|expense",
  "category_id": 1,
  "description": "描述",
  "date": "YYYY-MM-DD"
}
```

#### 更新交易
- PUT `/api/transactions/:id`
- 请求体：同创建交易

#### 删除交易
- DELETE `/api/transactions/:id`

### 统计数据

#### 获取统计信息
- GET `/api/statistics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- 响应：包含收支统计和分类统计

## 使用说明

1. 添加交易记录
   - 点击右上角"记一笔"按钮
   - 选择收入或支出
   - 填写金额和选择分类
   - 可选填写描述
   - 选择日期
   - 点击保存

2. 查看统计
   - 首页顶部显示本月收支统计
   - 图表展示分类统计
   - 列表显示最近交易记录

3. 数据管理
   - 所有数据保存在本地SQLite数据库
   - 数据库文件位于 `backend/database/bill.db`
   - 可以通过复制数据库文件进行备份

## 常见问题解决

### 1. 模块找不到错误

问题：`Module not found: Can't resolve './globals.css'`
解决：确保全局样式文件 `globals.css` 位于 `frontend/src/app/` 目录下，而不是 `src/styles/` 目录。

### 2. 后端连接错误

问题：前端无法连接到后端API
解决：
- 确保后端服务器正在运行（http://localhost:3001）
- 检查CORS设置是否正确
- 确认API请求地址是否正确

### 3. 数据库错误

问题：数据库操作失败
解决：
- 确保 `backend/database` 目录存在
- 检查数据库文件权限
- 确保SQLite3正确安装

### 4. PM2相关问题

问题：PM2启动失败
解决：
- 确保全局安装了PM2：`npm install -g pm2`
- 检查是否已编译TypeScript：`npm run build`
- 检查日志文件：`npm run logs`

### 5. 移动端显示问题

问题：移动端页面显示异常
解决：
- 确保添加了viewport meta标签
- 检查媒体查询是否正确
- 测试不同设备的显示效果

## 部署说明

### 后端部署

1. 准备工作
   ```bash
   cd backend
   npm install
   npm run build
   ```

2. 使用PM2部署
   ```bash
   npm start  # 启动服务
   pm2 save   # 保存当前进程列表
   pm2 startup # 设置开机自启
   ```

3. Nginx配置（可选）
   ```nginx
   location /api {
     proxy_pass http://localhost:3001;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection 'upgrade';
     proxy_set_header Host $host;
     proxy_cache_bypass $http_upgrade;
   }
   ```

### 前端部署

1. 构建
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. 使用Nginx部署
   ```nginx
   location / {
     root /path/to/frontend/dist;
     try_files $uri $uri/ /index.html;
   }
   ```

## 注意事项

1. 首次运行会自动创建数据库和默认分类
2. 确保后端服务正常运行，否则前端无法获取和保存数据
3. 如需备份数据，直接复制 `bill.db` 文件即可
4. 生产环境部署前请修改环境变量
5. 定期检查日志文件大小，避免占用过多磁盘空间

## 开发计划

- [ ] 添加数据导出功能
- [ ] 支持预算管理
- [ ] 添加图表分析
- [ ] 支持多币种
- [ ] 添加账户管理
- [ ] 优化移动端性能
- [ ] 添加手势操作
- [ ] 支持数据同步
- [ ] 添加定时备份

## 贡献指南

欢迎提交Issue和Pull Request。

## 许可证

MIT License 