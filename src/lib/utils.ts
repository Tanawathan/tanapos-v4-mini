import clsx, { type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(amount: number): string {
  const symbol = import.meta.env.VITE_CURRENCY_SYMBOL || 'NT$'
  return `${symbol}${amount.toLocaleString('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

// Calculate tax
export function calculateTax(amount: number): number {
  const taxRate = parseFloat(import.meta.env.VITE_DEFAULT_TAX_RATE || '0.07')
  return Math.round(amount * taxRate)
}

// Generate order number
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `ORD${timestamp}${random}`
}

// Format date/time
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date))
}

// Calculate elapsed time
export function calculateElapsedTime(startTime: string | Date): number {
  const start = new Date(startTime).getTime()
  const now = Date.now()
  return Math.floor((now - start) / 1000 / 60) // minutes
}

// Format elapsed time
export function formatElapsedTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分鐘`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}小時${remainingMinutes}分鐘`
}

// Vibration utility (for mobile devices)
export function vibrate(pattern: number | number[] = 100): void {
  if ('vibrate' in navigator && import.meta.env.VITE_ENABLE_VIBRATION === 'true') {
    navigator.vibrate(pattern)
  }
}

// Sound notification utility
export function playNotificationSound(): void {
  if (import.meta.env.VITE_ENABLE_SOUND_NOTIFICATIONS === 'true') {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Local storage utilities
export function setLocalStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return defaultValue
  }
}

// Error handling utility
export function handleError(error: any, context?: string): void {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error)
  
  // In production, you might want to send errors to a logging service
  if (import.meta.env.PROD) {
    // Send to error tracking service
  }
}

// Check if app is running as PWA
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}

// Get device info
export function getDeviceInfo() {
  return {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/i.test(navigator.userAgent),
    isStandalone: isStandalone(),
  }
}
