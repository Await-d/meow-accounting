# 喵呜记账

一个简单易用的个人记账应用，帮助你轻松管理日常收支。

## 功能特点

### 已实现功能

1. 用户系统
- [x] 用户注册和登录
- [x] 个人资料管理
- [x] 密码修改
- [x] 隐私模式设置
- [x] 访客模式

2. 记账功能
- [x] 收支记录管理
- [x] 分类管理
- [x] CSV导入
- [x] 金额隐藏

3. 家庭共享
- [x] 创建和管理家庭
- [x] 邀请家庭成员
- [x] 权限管理

### 计划功能

1. 数据管理
- [ ] CSV导出
- [ ] 数据备份
- [ ] 数据恢复
- [ ] 批量操作

2. 统计分析
- [ ] 收支趋势图
- [ ] 分类占比分析
- [ ] 预算管理
- [ ] 自定义报表

3. 个性化设置
- [ ] 主题切换
- [ ] 语言切换
- [ ] 货币单位设置
- [ ] 时区设置

4. 高级功能
- [ ] 定期记账提醒
- [ ] 账单OCR识别
- [ ] 多设备同步
- [ ] 账单标签
- [ ] 搜索过滤
- [ ] 收支模板

## 最近更新

- 添加隐私模式和访客模式
- 优化用户界面和交互体验
- 修复已知问题和bug

## 技术栈

- 前端：Next.js + TypeScript + TailwindCSS + NextUI
- 后端：Node.js + Express + SQLite
- 部署：Docker

## 安装使用

1. 克隆仓库
```bash
git clone https://github.com/your-username/meow-accounting.git
cd meow-accounting
```

2. 安装依赖
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

3. 启动开发服务器
```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm run dev
```

4. 访问应用
打开浏览器访问 http://localhost:3000

## API文档

### 用户相关

#### 注册
- 路径：POST /api/auth/register
- 参数：
  - username: 用户名
  - email: 邮箱
  - password: 密码

#### 登录
- 路径：POST /api/auth/login
- 参数：
  - email: 邮箱
  - password: 密码

### 交易相关

#### 获取交易列表
- 路径：GET /api/transactions
- 参数：
  - page: 页码
  - limit: 每页数量
  - startDate: 开始日期
  - endDate: 结束日期
  - type: 类型（收入/支出）
  - categoryId: 分类ID

#### 添加交易
- 路径：POST /api/transactions
- 参数：
  - type: 类型（收入/支出）
  - amount: 金额
  - category_id: 分类ID
  - description: 描述
  - date: 日期

## 常见问题

1. 如何重置密码？
   - 目前需要联系管理员重置密码

2. 如何导入数据？
   - 在交易列表页面点击"导入"按钮
   - 选择符合格式的CSV文件
   - 确认导入

3. 隐私模式如何使用？
   - 在设置页面启用隐私模式
   - 设置访客密码
   - 启用后所有金额将显示为***
   - 可以通过访客模式查看实际金额

## 贡献指南

1. Fork 本仓库
2. 创建特性分支
3. 提交代码
4. 创建 Pull Request

## 开源协议

MIT License 