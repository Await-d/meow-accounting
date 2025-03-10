# API设计文档

## 数据库设计

### routes表
```sql
CREATE TABLE routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    permission VARCHAR(50) NOT NULL,
    user_id INTEGER,
    family_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (family_id) REFERENCES families(id)
);
```

### route_stats表
```sql
CREATE TABLE route_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER NOT NULL,
    access_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    total_load_time INTEGER DEFAULT 0,
    average_load_time FLOAT DEFAULT 0,
    last_accessed TIMESTAMP,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id)
);
```

### route_params表
```sql
CREATE TABLE route_params (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    params JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### user_settings表
```sql
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'zh-CN',
    appearance JSON,
    performance JSON,
    notifications JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API接口

### 路由管理

#### 获取用户路由列表
- 路径：GET /api/routes/user/routes
- 参数：无
- 响应：
```typescript
{
    code: number;
    data: {
        routes: Route[];
    };
    message: string;
}
```

#### 获取家庭路由列表
- 路径：GET /api/routes/family/:familyId/routes
- 参数：
  - familyId: 家庭ID
- 响应：同上

#### 创建路由
- 路径：POST /api/routes
- 参数：
```typescript
{
    path: string;
    name: string;
    type: RouteType;
    description?: string;
    permission: RoutePermission;
    family_id?: number;
}
```
- 响应：
```typescript
{
    code: number;
    data: {
        id: number;
    };
    message: string;
}
```

#### 更新路由
- 路径：PUT /api/routes/:id
- 参数：同创建路由
- 响应：
```typescript
{
    code: number;
    message: string;
}
```

#### 删除路由
- 路径：DELETE /api/routes/:id
- 参数：无
- 响应：同上

### 性能监控

#### 记录路由访问
- 路径：POST /api/routes/stats/access
- 参数：
```typescript
{
    route_id: number;
    load_time: number;
    is_error: boolean;
    error_message?: string;
    from_cache: boolean;
}
```
- 响应：
```typescript
{
    code: number;
    message: string;
}
```

#### 获取性能报告
- 路径：GET /api/routes/stats/report
- 参数：
  - start_date?: string
  - end_date?: string
- 响应：
```typescript
{
    code: number;
    data: {
        totalRoutes: number;
        totalAccesses: number;
        totalErrors: number;
        averageLoadTime: number;
        mostAccessed: {
            path: string;
            accessCount: number;
            averageLoadTime: number;
            lastAccessed: string;
            errorCount: number;
        } | null;
        mostErrors: {
            path: string;
            accessCount: number;
            averageLoadTime: number;
            lastAccessed: string;
            errorCount: number;
        } | null;
        routeStats: Record<string, RouteStats>;
    };
    message: string;
}
```

### 参数管理

#### 保存路由参数
- 路径：POST /api/routes/:routeId/params
- 参数：
```typescript
{
    params: RouteParams;
}
```
- 响应：
```typescript
{
    code: number;
    message: string;
}
```

#### 获取路由参数
- 路径：GET /api/routes/:routeId/params
- 参数：无
- 响应：
```typescript
{
    code: number;
    data: {
        params: RouteParams;
    };
    message: string;
}
```

#### 清除路由参数
- 路径：DELETE /api/routes/:routeId/params
- 参数：无
- 响应：
```typescript
{
    code: number;
    message: string;
}
```

### 设置管理

#### 获取用户设置
- 路径：GET /api/users/settings
- 参数：无
- 响应：
```typescript
{
    code: number;
    data: {
        theme: string;
        language: string;
        appearance: {
            fontSize: number;
            animationSpeed: number;
            density: string;
        };
        performance: {
            prefetch: boolean;
            cacheSize: number;
            reducedAnimations: boolean;
        };
        notifications: {
            email: boolean;
            push: boolean;
            desktop: boolean;
            summary: string;
        };
    };
    message: string;
}
```

#### 更新用户设置
- 路径：PUT /api/users/settings
- 参数：同上响应的data部分
- 响应：
```typescript
{
    code: number;
    message: string;
}
```

## 错误码说明

- 200: 成功
- 400: 请求参数错误
- 401: 未授权
- 403: 无权限
- 404: 资源不存在
- 500: 服务器错误

## 注意事项

1. 所有接口都需要在header中携带token进行身份验证
2. 时间戳使用ISO 8601格式
3. 分页接口统一使用page和limit参数
4. 所有响应都包含code和message字段 