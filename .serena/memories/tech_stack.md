# 喵呜记账技术栈

## 前端技术栈

- **框架**: Next.js (React框架)
- **语言**: TypeScript
- **UI组件库**: NextUI
- **样式**: Tailwind CSS
- **状态管理**: React Query (Tanstack Query)
- **路由**: Next.js App Router
- **图表**: Recharts, Chart.js
- **动画**: Framer Motion
- **表单**: React Hook Form + Zod
- **主题**: next-themes
- **通知**: sonner, react-hot-toast
- **日期处理**: date-fns, dayjs
- **其他工具**: clsx, tailwind-merge

## 后端技术栈

- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: SQLite
- **ORM**: Prisma (根据配置)
- **身份验证**: JWT (jsonwebtoken)
- **密码加密**: bcrypt
- **API文档**: Swagger (swagger-jsdoc, swagger-ui-express)
- **验证**: Zod
- **日志**: Winston
- **文件上传**: multer
- **日期处理**: dayjs
- **缓存**: Redis (可选，通过ioredis)
- **环境变量**: dotenv

## 部署和开发工具

- **容器化**: Docker
- **版本控制**: Git
- **开发服务器**: ts-node-dev
- **构建工具**: TypeScript Compiler (tsc)
- **测试**: Jest (配置但未大量使用)
- **CI/CD**: Drone CI (.drone.yml)

## 架构模式

- **前后端分离架构**
- **后端采用MVC模式**
- **前端采用组件化架构**
- **RESTful API设计**