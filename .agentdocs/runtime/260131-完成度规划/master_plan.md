# 运行计划：完成度补全与验证

## Workflow Reference
`workflow/260131-完成度规划.md`

## 任务分解
| 任务ID | 任务描述 | 依赖 | 输入 | 预期输出 |
|---|---|---|---|---|
| T-01 | mock/placeholder/简化实现清单固化 | 无 | 代码检索结果 | 清单与分组 |
| T-02 | 定义真实数据来源与存储/缓存需求 | T-01 | 清单 | 数据来源与模型方案 |
| T-03 | README 功能覆盖核验矩阵 | T-01 | README/代码 | 覆盖矩阵 |
| T-04 | 路由预测真实化（后端） | T-02 | 模型方案 | 可用 API |
| T-05 | 路由优化建议真实化（后端） | T-02 | 模型方案 | 可用 API |
| T-06 | 路由分析报告导出真实化（后端） | T-02 | 模型方案 | 可用导出 |
| T-07 | 备份 API 实现（后端） | T-02 | 方案 | API 与安全校验 |
| T-08 | 账户功能补全或替代方案（后端） | T-02 | 方案 | API 与权限 |
| T-09 | 路由缓存统计/预热（后端） | T-02 | 方案 | API 与指标 |
| T-10 | 路由页面接入真实 API（前端） | T-04,T-05,T-06 | API | 前端接入完成 |
| T-11 | 备份页面接入真实 API（前端） | T-07 | API | 前端接入完成 |
| T-12 | 缓存统计接入（前端） | T-09 | API | 前端接入完成 |
| T-13 | 账户相关 UI 对齐 | T-08 | API | 前端对齐 |
| T-14 | 后端测试与修复 | T-04~T-09 | 代码 | 测试通过/问题记录 |
| T-15 | 前端 lint/build/test | T-10~T-13 | 代码 | 构建通过/问题记录 |
| T-16 | 关键 API 手工校验 | T-14,T-15 | 可运行服务 | 结果记录 |
| T-17 | README 覆盖核验 | T-03,T-10~T-13 | 覆盖矩阵 | 完整核验 |
| T-18 | 完成度结论与风险清单 | T-16,T-17 | 验证结果 | 结论与风险 |

## Agent Assignment
| 任务ID | Agent | 状态 | 开始时间 | 结束时间 |
|---|---|---|---|---|
| T-01 | Agent-01 | 🟡 Pending | - | - |
| T-02 | Agent-02 | 🟡 Pending | - | - |
| T-03 | Agent-03 | 🟡 Pending | - | - |
| T-04 | Agent-04 | 🟡 Pending | - | - |
| T-05 | Agent-05 | 🟡 Pending | - | - |
| T-06 | Agent-06 | 🟡 Pending | - | - |
| T-07 | Agent-07 | 🟡 Pending | - | - |
| T-08 | Agent-08 | 🟡 Pending | - | - |
| T-09 | Agent-09 | 🟡 Pending | - | - |
| T-10 | Agent-10 | 🟡 Pending | - | - |
| T-11 | Agent-11 | 🟡 Pending | - | - |
| T-12 | Agent-12 | 🟡 Pending | - | - |
| T-13 | Agent-13 | 🟡 Pending | - | - |
| T-14 | Agent-14 | 🟡 Pending | - | - |
| T-15 | Agent-15 | 🟡 Pending | - | - |
| T-16 | Agent-16 | 🟡 Pending | - | - |
| T-17 | Agent-17 | 🟡 Pending | - | - |
| T-18 | Agent-18 | 🟡 Pending | - | - |
