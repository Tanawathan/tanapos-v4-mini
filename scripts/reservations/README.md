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

## 待遷移 (Batch3 - schema / SQL / execute)
- execute-reservation-db-update.js
- execute-reservation-extension.js
- execute-reservation-walkin-update.js
- update-reservation-schema.js
- update-reservation-schema.sql
- reservation-database-extension.sql
- extend-reservation-for-walkin.sql
- fix-reservation-immediate.sql

## 改善 TODO
- test-updated-reservation-system.cjs 目前為精簡：需補回完整執行與輸出程式碼
- 清理硬編碼的 Supabase Keys（已部分改為 .env）
- 加入共用 util (e.g. createClient helper)
- 增加 README 使用示例與安全注意事項

## 執行方式
```bash
node scripts/reservations/test-reservation-auto-assignment.cjs
node scripts/reservations/create-test-reservations.js
```

## 環境變數需求 (.env)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
PRIVATE_SUPABASE_SERVICE_ROLE_KEY=
VITE_RESTAURANT_ID=

## 注意事項
- 本資料夾僅供開發/診斷。部署時應避免洩露 service role key。
- 大量操作資料的腳本請先在測試專案執行。
