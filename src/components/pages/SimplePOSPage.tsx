import React from 'react'
import NewPOSSystem from '../NewPOSSystem'
import { NotificationProvider } from '../ui/NotificationSystem'
import { useUIStyle } from '../../contexts/UIStyleContext'

const SimplePOSPage: React.FC = () => {
  const { currentStyle, styleConfig } = useUIStyle()

  return (
    <NotificationProvider>
      <div className={`min-h-screen ${styleConfig.bodyClass || ''} ${styleConfig.cssClass}`}>
        <NewPOSSystem />
      </div>
    </NotificationProvider>
  )
}

export default SimplePOSPage
