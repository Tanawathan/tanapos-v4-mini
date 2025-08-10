# Reservation Scripts

預約系統相關腳本（診斷 / 測試 / 建資料 / 分配 / 結構檢查）。

## 目前已遷移 (Batch2 完成)
- auto-assign-tables-to-reservations.cjs
- test-reservation-auto-assignment.cjs
- test-reservation-table-assignment.cjs
- test-updated-reservation-system.cjs (精簡版本，待補全)
- check-reservation-table-assignment.cjs / check-reservation-table-assignment.js
- check-reservation-table-mapping.cjs / check-reservation-table-mapping.js
- create-test-reservations.js
- create-real-reservation-data.js
- query-reservation-structure.js
- diagnose-reservation-issue.cjs

## Batch3 已遷移 (schema / SQL / execute)
- execute-reservation-db-update.js
- execute-reservation-extension.js
- execute-reservation-walkin-update.js
- update-reservation-schema.js
- sql/update-reservation-schema.sql
- sql/reservation-database-extension.sql
- sql/extend-reservation-for-walkin.sql
- sql/fix-reservation-immediate.sql

執行示例:
```
node scripts/reservations/execute-reservation-db-update.js
node scripts/reservations/execute-reservation-extension.js
node scripts/reservations/execute-reservation-walkin-update.js
node scripts/reservations/update-reservation-schema.js
```
> 多數 DDL 仍需於 Supabase Dashboard 以高權限執行。

## 改善 TODO
- test-updated-reservation-system.cjs 仍為精簡
- 已移除硬編碼 Supabase Keys (Batch3) 並集中於 util/createSupabaseClient.cjs
- 後續可新增 SQL 版本號與變更日誌
- 增補更完整安全指引

## 執行方式
```bash
node scripts/reservations/test-reservation-auto-assignment.cjs
node scripts/reservations/create-test-reservations.js
# Schema / Walk-in 更新
node scripts/reservations/execute-reservation-extension.js
node scripts/reservations/execute-reservation-walkin-update.js
```

## 環境變數需求 (.env)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
PRIVATE_SUPABASE_SERVICE_ROLE_KEY=
VITE_RESTAURANT_ID=

## 注意事項
- 本資料夾僅供開發/診斷。部署時應避免洩露 service role key。
- 大量操作資料的腳本請先在測試專案執行。
