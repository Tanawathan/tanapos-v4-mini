// 統一的狀態對應與樣式
import type { Order, OrderItem } from './types'

export const ORDER_STATUS_LABEL: Record<NonNullable<Order['status']>, string> = {
  pending: '待確認',
  confirmed: '已確認',
  preparing: '準備中',
  ready: '備餐完成',
  served: '已上菜',
  completed: '已完成',
  cancelled: '已取消',
}

export const ORDER_STATUS_COLOR: Record<NonNullable<Order['status']>, string> = {
  pending: 'bg-orange-100 text-orange-800 border-orange-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  served: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

export const PAYMENT_STATUS_LABEL: Record<NonNullable<Order['payment_status']>, string> = {
  unpaid: '未付款',
  partial: '部分付款',
  paid: '已付款',
  refunded: '已退款',
}

export const PAYMENT_STATUS_COLOR: Record<NonNullable<Order['payment_status']>, string> = {
  unpaid: 'bg-red-100 text-red-800 border-red-200',
  partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200',
}

export const ORDER_ITEM_STATUS_LABEL: Record<NonNullable<OrderItem['status']>, string> = {
  pending: '待處理',
  confirmed: '已確認',
  preparing: '準備中',
  ready: '完成',
  served: '已上菜',
  cancelled: '已取消',
}

export const ORDER_ITEM_STATUS_COLOR: Record<NonNullable<OrderItem['status']>, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-orange-100 text-orange-800 border-orange-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  served: 'bg-purple-100 text-purple-800 border-purple-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}
