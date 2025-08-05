// 測試 UUID 生成修復
console.log('測試 UUID 生成功能...')

// UUID 生成函數（兼容性處理）
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    console.log('✅ 使用原生 crypto.randomUUID()')
    return crypto.randomUUID()
  }
  
  console.log('⚠️ 使用後備 UUID 生成方案')
  // 後備方案：生成 UUID v4 格式
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 測試生成 5 個 UUID
for (let i = 1; i <= 5; i++) {
  const uuid = generateUUID()
  console.log(`UUID ${i}: ${uuid}`)
}

export { generateUUID }
