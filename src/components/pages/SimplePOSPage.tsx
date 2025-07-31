import React from 'react'
import SimplePOSSystem from '../basic/SimplePOSSystem'
import { NotificationProvider } from '../ui/NotificationSystem'
import { useUIStyle } from '../../contexts/UIStyleContext'

const SimplePOSPage: React.FC = () => {
  const { currentStyle, styleConfig } = useUIStyle()

  return (
    <NotificationProvider>
      <div className={`min-h-screen ${styleConfig.bodyClass || ''} ${styleConfig.cssClass}`}>
        <SimplePOSSystem uiStyle={currentStyle} />
      </div>
    </NotificationProvider>
  )
}

export default SimplePOSPage
