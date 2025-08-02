import React from 'react'

interface SimpleSpinnerProps {
  size?: number
  color?: string
}

const SimpleSpinner: React.FC<SimpleSpinnerProps> = ({ 
  size = 24, 
  color = '#3b82f6' 
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid #e5e7eb`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        display: 'inline-block'
      }}
      className="tanapos-spinner"
    />
  )
}

export default SimpleSpinner
