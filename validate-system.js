#!/usr/bin/env node

/**
 * TanaPOS V4-AI 系統功能驗證腳本
 * 用於快速檢查系統各模組是否正常運作
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 TanaPOS V4-AI 系統功能驗證開始...\n');

// 檢查項目清單
const checks = [
  {
    name: '📁 項目結構檢查',
    check: () => checkProjectStructure()
  },
  {
    name: '📦 依賴包檢查',
    check: () => checkDependencies()
  },
  {
    name: '⚙️ 配置文件檢查',
    check: () => checkConfigFiles()
  },
  {
    name: '🧩 組件文件檢查',
    check: () => checkComponents()
  },
  {
    name: '🔧 測試設置檢查',
    check: () => checkTestSetup()
  }
];

// 執行所有檢查
async function runAllChecks() {
  let passedChecks = 0;
  const totalChecks = checks.length;

  for (const check of checks) {
    try {
      console.log(`\n${check.name}:`);
      const result = await check.check();
      
      if (result.success) {
        console.log(`  ✅ ${result.message}`);
        passedChecks++;
      } else {
        console.log(`  ❌ ${result.message}`);
      }
      
      if (result.details) {
        result.details.forEach(detail => {
          console.log(`     ${detail}`);
        });
      }
    } catch (error) {
      console.log(`  ❌ 檢查失敗: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 檢查完成: ${passedChecks}/${totalChecks} 項通過`);
  
  if (passedChecks === totalChecks) {
    console.log('🎉 系統準備就緒，可以開始測試！');
    console.log('\n🚀 建議的測試執行順序:');
    console.log('   1. npm run dev (啟動開發伺服器)');
    console.log('   2. npm run test:quick (快速桌台管理測試)');
    console.log('   3. npm run test:e2e (完整端到端測試)');
  } else {
    console.log('⚠️  請先修復上述問題後再進行測試');
  }
  
  console.log('\n📋 測試指令參考:');
  console.log('   npm run test:e2e           # 執行所有端到端測試');
  console.log('   npm run test:e2e:ui        # 以視覺化模式執行測試');
  console.log('   npm run test:e2e:debug     # 除錯模式執行測試');
  console.log('   npm run test:quick         # 快速桌台管理測試');
}

// 檢查項目結構
function checkProjectStructure() {
  const requiredPaths = [
    'src/components/OrderingPage.tsx',
    'src/components/OrdersPage.tsx', 
    'src/components/TableManagementPage.tsx',
    'src/components/CheckoutPage.tsx',
    'src/lib',
    'src/App.tsx',
    'tests'
  ];

  const missing = [];
  const existing = [];

  requiredPaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      existing.push(filePath);
    } else {
      missing.push(filePath);
    }
  });

  return {
    success: missing.length === 0,
    message: missing.length === 0 
      ? `所有核心文件都存在 (${existing.length}個)`
      : `缺少 ${missing.length} 個核心文件`,
    details: missing.length > 0 ? missing.map(f => `❌ ${f}`) : existing.map(f => `✅ ${f}`)
  };
}

// 檢查依賴包
function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      '@supabase/supabase-js',
      'react',
      'zustand'
    ];
    
    const requiredDevDeps = [
      '@playwright/test',
      '@testing-library/react',
      'vitest'
    ];

    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep]);
    const missingDevDeps = requiredDevDeps.filter(dep => !packageJson.devDependencies?.[dep]);

    const allMissing = [...missingDeps, ...missingDevDeps];

    return {
      success: allMissing.length === 0,
      message: allMissing.length === 0 
        ? '所有必要依賴都已安裝' 
        : `缺少 ${allMissing.length} 個依賴`,
      details: allMissing.length > 0 ? allMissing.map(dep => `❌ ${dep}`) : undefined
    };
  } catch (error) {
    return {
      success: false,
      message: '無法讀取 package.json'
    };
  }
}

// 檢查配置文件
function checkConfigFiles() {
  const configFiles = [
    { file: 'vite.config.ts', name: 'Vite 配置' },
    { file: 'vitest.config.ts', name: 'Vitest 配置' },
    { file: 'playwright.config.ts', name: 'Playwright 配置' },
    { file: 'tsconfig.json', name: 'TypeScript 配置' },
    { file: '.env.example', name: '環境變數範例' }
  ];

  const results = configFiles.map(({ file, name }) => ({
    name,
    exists: fs.existsSync(file)
  }));

  const missingCount = results.filter(r => !r.exists).length;

  return {
    success: missingCount === 0,
    message: missingCount === 0 
      ? '所有配置文件都存在' 
      : `缺少 ${missingCount} 個配置文件`,
    details: results.map(r => `${r.exists ? '✅' : '❌'} ${r.name}`)
  };
}

// 檢查組件文件
function checkComponents() {
  const components = [
    'src/components/OrderingPage.tsx',
    'src/components/OrdersPage.tsx',
    'src/components/TableManagementPage.tsx', 
    'src/components/CheckoutPage.tsx'
  ];

  const results = [];
  let validComponents = 0;

  components.forEach(componentPath => {
    if (fs.existsSync(componentPath)) {
      try {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // 基本檢查：是否包含 React 組件結構
        const hasExport = content.includes('export') && content.includes('function');
        const hasReact = content.includes('React') || content.includes('react');
        
        if (hasExport && hasReact) {
          validComponents++;
          results.push(`✅ ${path.basename(componentPath)} - 正常`);
        } else {
          results.push(`⚠️ ${path.basename(componentPath)} - 結構可能有問題`);
        }
      } catch (error) {
        results.push(`❌ ${path.basename(componentPath)} - 讀取失敗`);
      }
    } else {
      results.push(`❌ ${path.basename(componentPath)} - 文件不存在`);
    }
  });

  return {
    success: validComponents === components.length,
    message: `${validComponents}/${components.length} 組件文件正常`,
    details: results
  };
}

// 檢查測試設置
function checkTestSetup() {
  const testFiles = [
    'tests/table-management.test.ts',
    'tests/end-to-end-workflow.test.ts',
    'src/test/setup.ts'
  ];

  const results = testFiles.map(file => ({
    file: path.basename(file),
    exists: fs.existsSync(file)
  }));

  const existingCount = results.filter(r => r.exists).length;

  // 檢查 package.json 中的測試腳本
  let hasTestScripts = false;
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    hasTestScripts = packageJson.scripts?.['test:e2e'] && packageJson.scripts?.['test'];
  } catch (error) {
    // ignore
  }

  return {
    success: existingCount === testFiles.length && hasTestScripts,
    message: `測試文件: ${existingCount}/${testFiles.length}, 測試腳本: ${hasTestScripts ? '✅' : '❌'}`,
    details: [
      ...results.map(r => `${r.exists ? '✅' : '❌'} ${r.file}`),
      `${hasTestScripts ? '✅' : '❌'} package.json 測試腳本`
    ]
  };
}

// 執行檢查
runAllChecks().catch(error => {
  console.error('❌ 檢查過程中發生錯誤:', error.message);
  process.exit(1);
});
