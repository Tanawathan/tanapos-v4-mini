import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 載入環境變數
dotenv.config()

// Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// 餐廳 ID
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111'

async function generateComboTestData() {
  console.log('🎯 生成套餐測試數據...')
  
  try {
    // 獲取最新的套餐數據（去重）
    const { data: allCombos, error: combosError } = await supabase
      .from('combo_products')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('created_at', { ascending: false })
    
    if (combosError) {
      console.error('❌ 查詢套餐失敗:', combosError)
      return
    }
    
    // 去重複 - 保留最新的
    const uniqueCombos = []
    const seenNames = new Set()
    
    for (const combo of allCombos) {
      if (!seenNames.has(combo.name)) {
        uniqueCombos.push(combo)
        seenNames.add(combo.name)
      }
    }
    
    console.log(`找到 ${uniqueCombos.length} 個不同的套餐`)
    
    // 為每個套餐生成完整數據
    const comboTestData = []
    
    for (const combo of uniqueCombos) {
      const { data: rules } = await supabase
        .from('combo_selection_rules')
        .select(`
          *,
          combo_selection_options(
            *,
            products(id, name, price)
          )
        `)
        .eq('combo_id', combo.id)
        .order('display_order')
      
      // 計算價格範圍
      let minPrice = combo.price
      let maxPrice = combo.price
      
      rules.forEach(rule => {
        if (rule.is_required && rule.combo_selection_options.length > 0) {
          const prices = rule.combo_selection_options.map(opt => opt.additional_price)
          minPrice += Math.min(...prices) * rule.min_selections
          maxPrice += Math.max(...prices) * rule.max_selections
        }
      })
      
      comboTestData.push({
        combo,
        rules,
        priceRange: { min: minPrice, max: maxPrice }
      })
    }
    
    // 生成測試用的 JavaScript 對象
    const testDataJS = `
// 自動生成的套餐測試數據
export const comboTestData = ${JSON.stringify(comboTestData, null, 2)};

// 快速測試函數
export function getComboById(id) {
  return comboTestData.find(item => item.combo.id === id);
}

export function getComboByName(name) {
  return comboTestData.find(item => item.combo.name === name);
}

export function getAllCombos() {
  return comboTestData.map(item => item.combo);
}

export function getAllRulesForCombo(comboId) {
  const item = getComboById(comboId);
  return item ? item.rules : [];
}

// 價格計算函數
export function calculateComboPrice(comboId, selections) {
  const item = getComboById(comboId);
  if (!item) return 0;
  
  let totalPrice = item.combo.price;
  
  item.rules.forEach(rule => {
    const ruleSelections = selections[rule.id] || [];
    ruleSelections.forEach(optionId => {
      const option = rule.combo_selection_options.find(opt => opt.id === optionId);
      if (option) {
        totalPrice += option.additional_price;
      }
    });
  });
  
  return totalPrice;
}

console.log('套餐測試數據已載入:', comboTestData.length, '個套餐');
    `
    
    // 寫入檔案
    await import('fs').then(fs => {
      fs.writeFileSync('./combo-test-data.js', testDataJS)
      console.log('✅ 測試數據已寫入 combo-test-data.js')
    })
    
    // 生成 HTML 測試頁面
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>真實套餐數據測試</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 p-8">
    <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">🎯 真實套餐數據測試</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${uniqueCombos.map((combo, index) => {
              const comboData = comboTestData[index]
              return `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-xl font-semibold text-gray-900 mb-3">${combo.name}</h3>
                <p class="text-gray-600 text-sm mb-4">${combo.description}</p>
                
                <div class="space-y-2 mb-4">
                    <div class="flex justify-between">
                        <span class="text-gray-600">基礎價格</span>
                        <span class="font-semibold">NT$ ${combo.price}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">價格範圍</span>
                        <span class="text-orange-600 font-semibold">NT$ ${comboData.priceRange.min} - ${comboData.priceRange.max}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">製作時間</span>
                        <span>${combo.preparation_time} 分鐘</span>
                    </div>
                </div>
                
                <div class="border-t pt-4">
                    <h4 class="font-medium text-gray-900 mb-2">選擇規則 (${comboData.rules.length})</h4>
                    <div class="space-y-1">
                        ${comboData.rules.map(rule => `
                        <div class="text-xs text-gray-600">
                            • ${rule.selection_name}: ${rule.min_selections}-${rule.max_selections} 選項
                            ${rule.is_required ? '<span class="text-red-500">*</span>' : '<span class="text-gray-400">(可選)</span>'}
                        </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="mt-4 pt-4 border-t">
                    <button 
                        onclick="showComboDetails('${combo.id}')"
                        class="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                    >
                        查看詳細規則
                    </button>
                </div>
            </div>
              `
            }).join('')}
        </div>
        
        <!-- 詳細資訊 Modal -->
        <div id="detailModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold" id="modalTitle">套餐詳細</h2>
                        <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                    </div>
                    <div id="modalContent"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const comboData = ${JSON.stringify(comboTestData, null, 2)};
        
        function showComboDetails(comboId) {
            const item = comboData.find(item => item.combo.id === comboId);
            if (!item) return;
            
            document.getElementById('modalTitle').textContent = item.combo.name + ' - 詳細規則';
            
            const content = \`
                <div class="space-y-6">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold mb-2">套餐資訊</h3>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>基礎價格: NT$ \${item.combo.price}</div>
                            <div>製作時間: \${item.combo.preparation_time} 分鐘</div>
                            <div>價格範圍: NT$ \${item.priceRange.min} - \${item.priceRange.max}</div>
                            <div>套餐類型: \${item.combo.combo_type}</div>
                        </div>
                        <p class="mt-2 text-gray-600">\${item.combo.description}</p>
                    </div>
                    
                    \${item.rules.map(rule => \`
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <h4 class="font-semibold">\${rule.selection_name}</h4>
                                    <p class="text-sm text-gray-600">\${rule.description}</p>
                                </div>
                                <div class="text-right text-sm">
                                    <div class="text-gray-600">選擇 \${rule.min_selections} - \${rule.max_selections} 個</div>
                                    <div class="\${rule.is_required ? 'text-red-500' : 'text-gray-400'}">\${rule.is_required ? '必選' : '可選'}</div>
                                </div>
                            </div>
                            
                            <div class="space-y-2">
                                <h5 class="text-sm font-medium text-gray-700">商品選項 (\${rule.combo_selection_options.length} 個):</h5>
                                \${rule.combo_selection_options.map(option => \`
                                    <div class="flex justify-between items-center py-1 px-2 bg-gray-50 rounded text-sm">
                                        <span>\${option.products.name} \${option.is_default ? '<span class="text-green-600">[預設]</span>' : ''}</span>
                                        <span class="\${option.additional_price > 0 ? 'text-red-600' : option.additional_price < 0 ? 'text-green-600' : 'text-gray-600'}">
                                            \${option.additional_price > 0 ? '+' : ''}\${option.additional_price !== 0 ? 'NT$ ' + option.additional_price : '無額外費用'}
                                        </span>
                                    </div>
                                \`).join('')}
                            </div>
                        </div>
                    \`).join('')}
                </div>
            \`;
            
            document.getElementById('modalContent').innerHTML = content;
            document.getElementById('detailModal').classList.remove('hidden');
        }
        
        function closeModal() {
            document.getElementById('detailModal').classList.add('hidden');
        }
        
        console.log('載入了', comboData.length, '個套餐的測試數據');
    </script>
</body>
</html>
    `
    
    await import('fs').then(fs => {
      fs.writeFileSync('./real-combo-test.html', htmlContent)
      console.log('✅ 真實套餐測試頁面已生成: real-combo-test.html')
    })
    
    console.log('\n🎉 套餐測試數據生成完成！')
    console.log('文件生成:')
    console.log('  - combo-test-data.js (測試數據)')
    console.log('  - real-combo-test.html (測試頁面)')
    
  } catch (error) {
    console.error('❌ 生成測試數據時發生錯誤:', error)
  }
}

// 執行生成
generateComboTestData()
