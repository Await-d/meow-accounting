# 喵呜记账架构指南

## 后端架构

喵呜记账后端采用经典MVC架构，使用TypeScript和Express框架构建。

### 1. 模型层 (Models)

- 位置: `backend/src/models/`
- 职责: 
  - 定义数据结构
  - 处理数据库操作
  - 实现业务逻辑
  
模型示例 (Transaction):
```typescript
// 定义交易记录模型
export interface Transaction {
    id: number;
    amount: number;
    type: 'income' | 'expense';
    category_id: number;
    user_id: number;
    family_id?: number;
    description: string;
    created_at: string;
    // ...其他字段
}

// 模型操作方法
export const createTransaction = async (data: Omit<Transaction, 'id' | 'created_at'>) => {
    // 数据库操作逻辑
};
```

### 2. 视图层 (Views)

在API服务中，视图层对应于API响应。标准响应格式:

```typescript
{
    code: number;    // 状态码
    data?: any;      // 响应数据
    message: string; // 消息描述
}
```

### 3. 控制器层 (Controllers)

- 位置: `backend/src/controllers/`
- 职责:
  - 接收HTTP请求
  - 处理请求参数验证
  - 调用模型层处理业务逻辑
  - 格式化响应数据

控制器示例:
```typescript
export const getTransactions = async (req: Request, res: Response) => {
    try {
        const user_id = req.user.id;
        const transactions = await Transaction.getByUserId(user_id);
        
        return res.json({
            code: 200,
            data: { transactions },
            message: '获取交易记录成功'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
};
```

### 4. 路由层 (Routes)

- 位置: `backend/src/routes/`
- 职责:
  - 定义API端点
  - 应用中间件
  - 将请求路由到对应控制器

路由示例:
```typescript
import express from 'express';
import { getTransactions, createTransaction } from '../controllers/transaction.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, getTransactions);
router.post('/', authMiddleware, createTransaction);

export default router;
```

### 5. 中间件层 (Middleware)

- 位置: `backend/src/middleware/`
- 常用中间件:
  - 认证中间件 (auth.middleware.ts)
  - 权限检查中间件 (admin.middleware.ts)
  - 请求验证中间件 (validate.ts)
  - 错误处理中间件

## 前端架构

喵呜记账前端采用基于Next.js App Router的组件化架构。

### 1. 页面组件 (Pages)

- 位置: `frontend/src/app/`
- 职责:
  - 定义路由结构
  - 组合其他组件
  - 获取页面级数据

### 2. 组件 (Components)

- 位置: `frontend/src/components/`
- 类型:
  - UI组件: 纯展示型组件
  - 容器组件: 包含业务逻辑的组件
  - 布局组件: 处理页面布局

### 3. 自定义Hooks (Custom Hooks)

- 位置: `frontend/src/hooks/`
- 职责:
  - 封装复用逻辑
  - 处理API调用
  - 管理状态

示例:
```typescript
export function useTransactions() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/transactions');
            const data = await response.json();
            setTransactions(data.transactions);
        } catch (error) {
            console.error('获取交易记录失败', error);
        } finally {
            setLoading(false);
        }
    };
    
    return { transactions, loading, fetchTransactions };
}
```

### 4. 工具函数 (Utils)

- 位置: `frontend/src/utils/` 和 `frontend/src/lib/`
- 职责:
  - 提供通用功能
  - 处理数据格式化
  - 封装API调用

## API设计规范

喵呜记账API遵循RESTful设计原则:

1. 资源命名使用复数名词: `/transactions`, `/categories`
2. HTTP方法映射:
   - GET: 获取资源
   - POST: 创建资源
   - PUT: 更新资源
   - DELETE: 删除资源
3. 查询参数用于筛选: `?start_date=2025-01-01&end_date=2025-01-31`
4. 状态码使用标准HTTP状态码

## 数据流

1. 用户在前端界面操作
2. 前端组件调用自定义Hook
3. Hook函数发起API请求
4. 后端路由接收请求
5. 路由调用对应控制器
6. 控制器验证请求并调用模型层
7. 模型层处理业务逻辑和数据操作
8. 结果返回给控制器
9. 控制器格式化响应并返回给前端
10. Hook函数处理响应数据
11. 组件状态更新，UI重新渲染