#!/usr/bin/env node
// Convert external ingredient CSV into our raw_materials import format
// Usage: node scripts/inventory/convert-csv.mjs <input.csv> <output.csv>

import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const [, , inputPath, outputPath] = process.argv;
if (!inputPath) die('Missing input.csv. Usage: node scripts/inventory/convert-csv.mjs <input.csv> <output.csv>');
const out = outputPath || path.join(process.cwd(), 'raw_materials_converted.csv');

if (!fs.existsSync(inputPath)) die(`Input not found: ${inputPath}`);

// Heuristics: map common column names in Chinese to our schema
// Our target headers: name,unit,category,current_stock,min_stock,max_stock,cost_per_unit
const FIELD_MAPS = [
  // name
  { target: 'name', candidates: ['名稱', '品名', '食材', '食材名稱', '材料', '原物料', '商品名稱', '名稱/規格', 'name'] },
  // unit
  { target: 'unit', candidates: ['單位', '計量單位', '單位(規格)', '包裝單位', 'unit'] },
  // category
  { target: 'category', candidates: ['分類', '品類', '種類', '大類', 'category'] },
  // current_stock
  { target: 'current_stock', candidates: ['庫存', '現有庫存', '期末庫存', '數量', 'stock', 'current_stock'] },
  // min_stock
  { target: 'min_stock', candidates: ['安全庫存', '最低庫存', 'min', 'min_stock'] },
  // max_stock
  { target: 'max_stock', candidates: ['最高庫存', 'max', 'max_stock'] },
  // cost_per_unit
  { target: 'cost_per_unit', candidates: ['成本', '單價', '進貨單價', '平均成本', '成本單價', '成本/單位', 'cost', 'cost_per_unit'] },
];

function normalizeHeader(h) {
  return String(h).trim().replace(/\s+/g, '').toLowerCase();
}

function findSourceKey(headers, candidates) {
  const norm = headers.map(normalizeHeader);
  for (const c of candidates) {
    const idx = norm.indexOf(normalizeHeader(c));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function toNumberSafe(v) {
  if (v === null || v === undefined) return 0;
  const s = String(v).replace(/[,\s]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseCSVSync(file) {
  const text = fs.readFileSync(file, 'utf8');
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.warn('CSV parse warnings:', parsed.errors.slice(0, 3));
  }
  return parsed.data;
}

function buildMapping(rows) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const mapping = {};
  for (const m of FIELD_MAPS) {
    const src = findSourceKey(headers, m.candidates);
    mapping[m.target] = src; // can be null
  }
  return mapping;
}

function transformRows(rows, mapping) {
  const out = [];
  for (const row of rows) {
    const name = row[mapping.name] ?? '';
    if (!String(name).trim()) continue; // skip empty
    const unit = row[mapping.unit] ?? '個';
    const category = row[mapping.category] ?? '未分類';
    const current_stock = toNumberSafe(row[mapping.current_stock]);
    const min_stock = toNumberSafe(row[mapping.min_stock]);
    const max_stock = toNumberSafe(row[mapping.max_stock]);
    const cost_per_unit = toNumberSafe(row[mapping.cost_per_unit]);

    out.push({ name, unit, category, current_stock, min_stock, max_stock, cost_per_unit });
  }
  return out;
}

function writeCSV(file, rows) {
  const csv = Papa.unparse(rows, {
    columns: ['name', 'unit', 'category', 'current_stock', 'min_stock', 'max_stock', 'cost_per_unit'],
  });
  fs.writeFileSync(file, csv, 'utf8');
}

const rows = parseCSVSync(inputPath);
const mapping = buildMapping(rows);
const transformed = transformRows(rows, mapping);
if (!transformed.length) die('No valid rows after transform.');
writeCSV(out, transformed);

console.log(`OK: ${transformed.length} rows -> ${out}`);
