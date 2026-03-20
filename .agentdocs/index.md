# .agentdocs 索引

## 当前任务文档
- `workflow/260131-完成度规划.md` - 完成度补全、验证与覆盖核验的详细任务规划
- `workflow/260320-未完成功能修复方案.md` - 所有未完成/半完成功能的详细修复方案（18项，含优先级与实施顺序）

## 已归档任务
- 暂无

## Known Pitfalls
- [2026-03-20] `routes/index.ts` 从未被 `app.ts` 使用 → 路由统计/参数/设置端点全部 404 → 需将路由迁移到各自文件并在 app.ts 挂载
- [2026-03-20] Next.js `NEXT_PUBLIC_*` 变量必须在构建时设置，不能仅靠运行时环境变量
- [2026-03-20] `user.controller.ts` 传 `password_hash` 但 model 期望 `password` key → 密码更新静默失败

## Architecture Decisions
- [2026-03-20] 备份路由挂载在 `/api/settings/backups`（app.ts L71），前端 API_BASE_URL 已含 `/api` 前缀，路径可对上
- [2026-03-20] report.routes.ts 未挂载，需在 app.ts 添加 `app.use('/api/reports', reportRoutes)`
