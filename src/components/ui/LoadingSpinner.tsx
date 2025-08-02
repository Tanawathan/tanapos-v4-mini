import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LoadingSpinner = ({ size = 'md', className = '' }: LoadingSpinnerProps) => {
  const sizes = {
    sm: { width: '1rem', height: '1rem' },
    md: { width: '2rem', height: '2rem' },
    lg: { width: '3rem', height: '3rem' }
  }

  return (
    <div
      style={{
        ...sizes[size],
        border: '2px solid #e5e7eb',
        borderTop: '2px solid #3b82f6',
        borderRadius: '50%',
        display: 'inline-block'
      }}
      className={`tanapos-spinner ${className}`}
    />
  )
}

export default LoadingSpinner
