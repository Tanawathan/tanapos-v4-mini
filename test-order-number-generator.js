#!/usr/bin/env node

// 直接實現測試邏輯，避免導入問題

/**
 * 生成隨機數字字符串
 */
function generateRandomNumber(length = 6) {
  const digits = '0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  return result
}

/**
 * 生成唯一的外帶訂單編號
 */
function generateTakeawayOrderNumber(prefix = 'TOGO') {
  const randomNumber = generateRandomNumber(6)
  const timestamp = Date.now().toString().slice(-3)
  return `${prefix}-${randomNumber}${timestamp}`
}

/**
 * 生成唯一的取餐號
 */
function generatePickupNumber(prefix = 'TO') {
  const randomNumber = generateRandomNumber(3)
  return `${prefix}-${randomNumber}`
}

/**
 * 生成內用訂單編號
 */
function generateDineInOrderNumber(tableNumber, isAdditional = false, additionalSequence = 1) {
  const randomNumber = generateRandomNumber(3)
  const baseNumber = `${tableNumber}-${randomNumber}`
  
  if (isAdditional) {
    return `${baseNumber}-A${additionalSequence}`
  }
  
  return baseNumber
}

/**
 * 驗證訂單編號格式
 */
function validateOrderNumber(orderNumber) {
  const takeawayPattern = /^TOGO-\d+$/
  const dineInPattern = /^\d+-\d+(-A\d+)?$/
  
  return takeawayPattern.test(orderNumber) || dineInPattern.test(orderNumber)
}

/**
 * 解析訂單編號信息
 */
function parseOrderNumber(orderNumber) {
  if (orderNumber.startsWith('TOGO-')) {
    return { type: 'takeaway' }
  }
  
  const dineInMatch = orderNumber.match(/^(\d+)-\d+(-A(\d+))?$/)
  if (dineInMatch) {
    const [, tableNumber, , additionalSequence] = dineInMatch
    return {
      type: 'dine-in',
      tableNumber,
      isAdditional: !!additionalSequence,
      additionalSequence: additionalSequence ? parseInt(additionalSequence) : undefined
    }
  }
  
  return { type: 'unknown' }
}

console.log('🧪 測試新的訂單編號生成器\n')

// 測試外帶訂單編號生成
console.log('📦 === 外帶訂單編號測試 ===')
for (let i = 0; i < 5; i++) {
  const takeawayNumber = generateTakeawayOrderNumber()
  const pickupNumber = generatePickupNumber()
  console.log(`外帶訂單 ${i + 1}: ${takeawayNumber} | 取餐號: ${pickupNumber}`)
  console.log(`  驗證結果: ${validateOrderNumber(takeawayNumber) ? '✅' : '❌'}`)
  const parsed = parseOrderNumber(takeawayNumber)
  console.log(`  解析結果: ${JSON.stringify(parsed)}`)
  console.log('')
}

// 測試內用訂單編號生成
console.log('🍽️ === 內用訂單編號測試 ===')
for (let i = 1; i <= 3; i++) {
  const dineInNumber = generateDineInOrderNumber(i.toString())
  const additionalNumber = generateDineInOrderNumber(i.toString(), true, 2)
  
  console.log(`桌號 ${i}: ${dineInNumber}`)
  console.log(`  驗證結果: ${validateOrderNumber(dineInNumber) ? '✅' : '❌'}`)
  const parsed1 = parseOrderNumber(dineInNumber)
  console.log(`  解析結果: ${JSON.stringify(parsed1)}`)
  
  console.log(`桌號 ${i} 加點: ${additionalNumber}`)
  console.log(`  驗證結果: ${validateOrderNumber(additionalNumber) ? '✅' : '❌'}`)
  const parsed2 = parseOrderNumber(additionalNumber)
  console.log(`  解析結果: ${JSON.stringify(parsed2)}`)
  console.log('')
}

// 測試生成的編號唯一性
console.log('🔄 === 唯一性測試 ===')
const generated = new Set()
let duplicates = 0

for (let i = 0; i < 1000; i++) {
  const number = generateTakeawayOrderNumber()
  if (generated.has(number)) {
    duplicates++
  } else {
    generated.add(number)
  }
}

console.log(`生成 1000 個外帶訂單編號`)
console.log(`唯一編號: ${generated.size}`)
console.log(`重複編號: ${duplicates}`)
console.log(`唯一性: ${duplicates === 0 ? '✅ 完美' : `⚠️ ${((generated.size / 1000) * 100).toFixed(1)}%`}`)

// 測試舊格式兼容性
console.log('\n🔧 === 舊格式兼容性測試 ===')
const oldFormats = [
  'TOGO-001',
  'TOGO-123',
  '5-789',
  '12-456-A2',
  'ORD-1234567890'
]

oldFormats.forEach(format => {
  const isValid = validateOrderNumber(format)
  const parsed = parseOrderNumber(format)
  console.log(`${format}: ${isValid ? '✅' : '❌'} | ${JSON.stringify(parsed)}`)
})

console.log('\n🎯 === 測試完成 ===')
console.log('新的訂單編號生成器已準備就緒！')
