// 訂單編號生成工具

/**
 * 生成隨機數字字符串
 * @param length 數字長度
 * @returns 隨機數字字符串
 */
export function generateRandomNumber(length: number = 6): string {
  const digits = '0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  return result
}

/**
 * 生成唯一的外帶訂單編號
 * @param prefix 前綴，默認為 'TOGO'
 * @returns 格式: TOGO-XXXXXX (6位隨機數字)
 */
export function generateTakeawayOrderNumber(prefix: string = 'TOGO'): string {
  const randomNumber = generateRandomNumber(6)
  const timestamp = Date.now().toString().slice(-3) // 添加時間戳後3位增加唯一性
  return `${prefix}-${randomNumber}${timestamp}`
}

/**
 * 生成唯一的取餐號
 * @param prefix 前綴，默認為 'TO'
 * @returns 格式: TO-XXX (3位隨機數字)
 */
export function generatePickupNumber(prefix: string = 'TO'): string {
  const randomNumber = generateRandomNumber(3)
  return `${prefix}-${randomNumber}`
}

/**
 * 生成內用訂單編號
 * @param tableNumber 桌號
 * @param isAdditional 是否為加點訂單
 * @param additionalSequence 加點序號
 * @returns 格式: 桌號-XXX 或 桌號-XXX-A序號
 */
export function generateDineInOrderNumber(
  tableNumber: string, 
  isAdditional: boolean = false, 
  additionalSequence: number = 1
): string {
  const randomNumber = generateRandomNumber(3)
  const baseNumber = `${tableNumber}-${randomNumber}`
  
  if (isAdditional) {
    return `${baseNumber}-A${additionalSequence}`
  }
  
  return baseNumber
}

/**
 * 驗證訂單編號格式
 * @param orderNumber 訂單編號
 * @returns 是否為有效格式
 */
export function validateOrderNumber(orderNumber: string): boolean {
  // 外帶訂單格式: TOGO-數字
  const takeawayPattern = /^TOGO-\d+$/
  // 內用訂單格式: 數字-數字 或 數字-數字-A數字
  const dineInPattern = /^\d+-\d+(-A\d+)?$/
  
  return takeawayPattern.test(orderNumber) || dineInPattern.test(orderNumber)
}

/**
 * 解析訂單編號信息
 * @param orderNumber 訂單編號
 * @returns 訂單編號信息
 */
export function parseOrderNumber(orderNumber: string): {
  type: 'takeaway' | 'dine-in' | 'unknown'
  tableNumber?: string
  isAdditional?: boolean
  additionalSequence?: number
} {
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
