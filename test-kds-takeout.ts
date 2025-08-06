// KDS 外帶訂單檢測測試
// 這個文件用於測試外帶訂單的檢測邏輯

// 測試用例
const testCases = [
  // 外帶訂單測試案例
  { orderNumber: 'TOGO-001', expected: true, description: '標準外帶訂單格式' },
  { orderNumber: '#TOGO-002', expected: true, description: '帶井號的外帶訂單' },
  { orderNumber: 'togo-003', expected: true, description: '小寫外帶訂單' },
  { orderNumber: 'ToGo-004', expected: true, description: '混合大小寫外帶訂單' },
  
  // 非外帶訂單測試案例
  { orderNumber: 'DIN-001', expected: false, description: '內用訂單' },
  { orderNumber: '001', expected: false, description: '純數字訂單' },
  { orderNumber: 'ORDER-001', expected: false, description: '一般訂單' },
  { orderNumber: '#001', expected: false, description: '帶井號的一般訂單' },
  
  // 邊界測試案例
  { orderNumber: '', expected: false, description: '空字串' },
  { orderNumber: null, expected: false, description: '空值' },
  { orderNumber: undefined, expected: false, description: '未定義' },
];

// 檢測函數（與組件中相同）
const isTakeoutOrder = (orderNumber: string): boolean => {
  return orderNumber?.toUpperCase().startsWith('TOGO-') || orderNumber?.toUpperCase().startsWith('#TOGO-');
};

// 格式化函數（與組件中相同）
const formatOrderNumber = (orderNumber: string): string => {
  if (isTakeoutOrder(orderNumber)) {
    return orderNumber.replace(/^#?TOGO-/i, '');
  }
  return orderNumber;
};

// 執行測試
console.log('🧪 KDS 外帶訂單檢測測試');
console.log('========================');

testCases.forEach((testCase, index) => {
  const result = isTakeoutOrder(testCase.orderNumber);
  const formatted = formatOrderNumber(testCase.orderNumber);
  const passed = result === testCase.expected;
  
  console.log(`測試 ${index + 1}: ${passed ? '✅' : '❌'} ${testCase.description}`);
  console.log(`  輸入: "${testCase.orderNumber}"`);
  console.log(`  檢測結果: ${result} (預期: ${testCase.expected})`);
  console.log(`  格式化結果: "${formatted}"`);
  console.log('');
});

// 驗證視覺標示邏輯
console.log('🎨 視覺標示測試');
console.log('================');

const visualTests = [
  'TOGO-001',
  'DIN-001',
  '#TOGO-002',
  'ORDER-123'
];

visualTests.forEach(orderNumber => {
  const isTakeout = isTakeoutOrder(orderNumber);
  const formatted = formatOrderNumber(orderNumber);
  
  console.log(`訂單號: ${orderNumber}`);
  console.log(`  是否外帶: ${isTakeout ? '🥡 是' : '🍽️ 否'}`);
  console.log(`  顯示為: ${isTakeout ? `🥡 外帶 #${formatted}` : `#${orderNumber}`}`);
  console.log(`  卡片樣式: ${isTakeout ? '橙色背景 + 外帶標示' : '標準樣式'}`);
  console.log('');
});

export { isTakeoutOrder, formatOrderNumber };
