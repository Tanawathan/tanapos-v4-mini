# Inventory CSV Conversion

This folder contains helper scripts to convert external ingredient spreadsheets into the app's `raw_materials` import format.

- Target headers: `name,unit,category,current_stock,min_stock,max_stock,cost_per_unit`
- Converter: `scripts/inventory/convert-csv.mjs`

Usage:

```
node scripts/inventory/convert-csv.mjs <input.csv> <output.csv>
```

Notes:
- The converter uses heuristics for Chinese column names (e.g., 名稱, 單位, 安全庫存, 成本...).
- Missing fields default to: unit=個, category=未分類, numbers=0.
- Output CSV can be imported via Raw Materials page -> CSV 匯入.
