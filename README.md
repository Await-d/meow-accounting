# 喵呜记账

一个功能强大的路由管理系统，支持路由优化、性能监控和自定义设置。

## 功能特性

### 路由分析
- 路由访问分布可视化（饼图）
- 路由加载时间趋势分析（折线图）
- 错误率统计和监控
- 实时性能报告

### 性能监控
- 路由加载时间追踪
- 错误率监控
- 缓存命中率统计
- 预热状态跟踪
- 详细的性能报告生成

### 自定义设置
- 主题切换（浅色/深色/系统）
- 语言选择
- 外观设置（字体大小、动画速度、布局密度）
- 性能设置（预加载、缓存大小、动画效果）
- 通知设置（邮件、推送、桌面通知）

### 路由参数持久化
- 自动保存路由参数
- 参数恢复功能
- 参数验证
- 清除参数功能

## 技术栈

- React + Next.js
- TypeScript
- NextUI 组件库
- Recharts 图表库
- Local Storage 持久化存储

## 使用方法

### 路由分析
```tsx
import { RouteAnalytics } from '@/components/RouteAnalytics';

function Dashboard() {
    return <RouteAnalytics />;
}
```

### 性能监控
```tsx
import { useRouteMonitor } from '@/hooks/useRouteMonitor';

function App() {
    const { getPerformanceReport } = useRouteMonitor();
    // 使用性能报告数据
}
```

### 自定义设置
```tsx
import { CustomSettings } from '@/components/CustomSettings';

function SettingsPage() {
    return <CustomSettings />;
}
```

### 路由参数持久化
```tsx
import { useRouteParams } from '@/hooks/useRouteParams';

function Component() {
    const { saveParams, getParams, clearParams } = useRouteParams();
    // 管理路由参数
}
```

## 配置选项

### 性能监控配置
- 加载时间阈值
- 错误率警告阈值
- 缓存大小限制
- 预热超时设置

### 自定义设置选项
- 主题：light/dark/system
- 语言：zh-CN/en-US
- 字体大小：12-24px
- 动画速度：0-500ms
- 布局密度：comfortable/compact/spacious
- 缓存大小：0-200MB

## 开发计划

- [x] 基础路由管理
- [x] 路由分析图表
- [x] 性能监控系统
- [x] 自定义设置
- [x] 参数持久化
- [ ] 路由预测系统
- [ ] 性能优化建议
- [ ] 更多数据可视化
- [ ] 导出分析报告 