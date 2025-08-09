import React from 'react'
import { OrderingLayout } from '../ordering/components'

// Thin wrapper kept temporarily for backward compatibility with any imports of OrderingPage.
// Legacy implementation removed; main logic now lives entirely in OrderingLayout.
export interface OrderingPageProps { onBack?: () => void }

const OrderingPage: React.FC<OrderingPageProps> = () => {
  return <OrderingLayout />
}

export default OrderingPage
