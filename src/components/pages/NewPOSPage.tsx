import React, { useState } from 'react'
import NewPOSSystem from '../basic/NewPOSSystem'
import { useUIStyle } from '../../contexts/UIStyleContext'
import { NotificationProvider } from '../ui/NotificationSystem'

const NewPOSPage: React.FC = () => {
  const { currentStyle, styleConfig, setStyle, availableStyles } = useUIStyle()
  const [currentStyleLocal, setCurrentStyleLocal] = useState('modern')
  
  const uiStyles = [
    { value: 'modern', label: '極簡現代' },
    { value: 'neumorphism', label: '新擬物風格' },
    { value: 'glassmorphism', label: '玻璃質感' },
    { value: 'brutalism', label: '極繁主義' },
    { value: 'cyberpunk', label: '未來科技' },
    { value: 'kawaii', label: '可愛風格' },
    { value: 'skeuomorphism', label: '擬物風格' },
    { value: 'dos', label: 'DOS 復古' },
    { value: 'bios', label: 'BIOS 風格' },
    { value: 'code', label: '程式碼風格' }
  ]

  return (
    <NotificationProvider>
      <div className={`min-h-screen ${currentStyle === 'glassmorphism' ? 'glassmorphism-body' : 
                                     currentStyle === 'neumorphism' ? 'neumorphism-body' :
                                     currentStyle === 'brutalism' ? 'brutalism-body' :
                                     currentStyle === 'cyberpunk' ? 'cyberpunk-body' :
                                     currentStyle === 'kawaii' ? 'kawaii-body' :
                                     currentStyle === 'dos' ? 'dos-body' :
                                     currentStyle === 'bios' ? 'bios-body' :
                                     currentStyle === 'code' ? 'code-body' : ''}`}>
        

        
        {/* 新的 POS 系統 */}
        <NewPOSSystem uiStyle={currentStyle} />
      </div>
    </NotificationProvider>
  )
}

export default NewPOSPage
