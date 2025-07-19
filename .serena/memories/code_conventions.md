# 喵呜记账代码约定

## 通用约定

### 文件命名
- **后端文件**:
  - 控制器: `*.controller.ts`
  - 路由: `*.routes.ts`
  - 模型: 实体名称，如 `user.ts`, `transaction.ts`
  - 中间件: `*.middleware.ts` 或 `*.ts`
  
- **前端文件**:
  - 页面: Next.js App Router格式 `page.tsx` (位于对应路由目录)
  - 组件: PascalCase格式，如 `TransactionForm.tsx`
  - 钩子: camelCase格式，以"use"开头，如 `useTransactions.ts`

### 代码风格

- **缩进**: 使用4个空格
- **分号**: 语句结尾使用分号
- **引号**: 使用单引号作为字符串定界符
- **行长度**: 尽量控制在120个字符以内
- **注释**: 使用JSDoc风格的注释

## TypeScript 规范

- 总是声明变量类型
- 使用接口(interface)定义对象结构
- 使用类型别名(type)定义复杂类型
- 导出类型使用`export`而不是`export default`
- 避免使用`any`类型，必要时使用`unknown`

## React & Next.js 规范

- 使用函数组件和React Hooks
- 客户端组件顶部使用`'use client'`指令
- 组件参数使用解构赋值
- Props应定义明确的类型接口
- 避免内联样式，优先使用Tailwind CSS类名

## Express & API 规范

- 使用控制器处理请求逻辑
- 路由使用RESTful命名约定
- 使用中间件进行认证和验证
- API响应格式统一为:
  ```ts
  {
    code: number;    // 状态码
    data?: any;      // 响应数据
    message: string; // 消息描述
  }
  ```

## Git 提交规范

提交信息格式:
```
类型: 简短描述

详细描述(可选)
```

类型包括:
- `功能`: 新功能
- `修复`: 错误修复
- `文档`: 文档更改
- `样式`: 格式调整
- `重构`: 代码重构
- `性能`: 性能优化
- `测试`: 测试相关
- `构建`: 构建系统或依赖更改