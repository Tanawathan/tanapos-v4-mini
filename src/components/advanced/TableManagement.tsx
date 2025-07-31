import React, { useState, useEffect } from 'react'
import { usePOSStore } from '../../lib/store-complete'
import { useUIStyle } from '../../contexts/UIStyleContext'
import type { Table } from '../../lib/types-unified'

// 桌位狀態類型
type TableStatus = 'available' | 'occupied' | 'cleaning' | 'reserved' | 'out_of_order'

// 預約接口
interface Reservation {
  id: string
  customer_name: string
  customer_phone?: string
  party_size: number
  reservation_time: string
  table_number?: number
  status: 'pending' | 'confirmed' | 'seated' | 'cancelled'
  notes?: string
}

// 桌台管理組件
export default function TableManagement() {
  const { tables } = usePOSStore()
  const { currentStyle } = useUIStyle()
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [showReservationModal, setShowReservationModal] = useState(false)

  // 模擬預約資料
  const [reservations] = useState<Reservation[]>([
    {
      id: '1',
      customer_name: '方6',
      party_size: 5,
      reservation_time: '2025-07-31T16:00:00',
      status: 'confirmed',
      table_number: 6
    },
    {
      id: '2',
      customer_name: '圓3',
      party_size: 2,
      reservation_time: '2025-07-31T18:00:00',
      status: 'confirmed',
      table_number: 3
    },
    {
      id: '3',
      customer_name: '方2內',
      party_size: 1,
      reservation_time: '2025-07-31T18:00:00',
      status: 'confirmed'
    }
  ])

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 獲取主題顏色
  const getThemeColors = () => {
    const styles = {
      modern: {
        bg: '#f8fafc',
        cardBg: '#ffffff',
        text: '#1e293b',
        subText: '#64748b',
        border: '#e2e8f0',
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        hover: '#f1f5f9'
      },
      neumorphism: {
        bg: '#e6e6e6',
        cardBg: '#e6e6e6',
        text: '#333333',
        subText: '#666666',
        border: '#d1d1d1',
        primary: '#667eea',
        success: '#48bb78',
        warning: '#ed8936',
        danger: '#f56565',
        shadow: '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff',
        hover: '#f0f0f0'
      },
      glassmorphism: {
        bg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
        cardBg: 'rgba(255, 255, 255, 0.25)',
        text: '#ffffff',
        subText: 'rgba(255, 255, 255, 0.8)',
        border: 'rgba(255, 255, 255, 0.18)',
        primary: '#60a5fa',
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#f87171',
        shadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        hover: 'rgba(255, 255, 255, 0.1)'
      },
      brutalism: {
        bg: '#ffff00',
        cardBg: '#ffffff',
        text: '#000000',
        subText: '#333333',
        border: '#000000',
        primary: '#ff0000',
        success: '#00ff00',
        warning: '#ff8800',
        danger: '#ff0000',
        shadow: '4px 4px 0px #000000',
        hover: '#f0f0f0'
      },
      cyberpunk: {
        bg: '#0a0a0a',
        cardBg: '#1a1a2e',
        text: '#00ff88',
        subText: '#888888',
        border: '#00ff88',
        primary: '#00ffff',
        success: '#00ff88',
        warning: '#ffaa00',
        danger: '#ff0044',
        shadow: '0 0 10px rgba(0, 255, 136, 0.3)',
        hover: '#16213e'
      },
      kawaii: {
        bg: '#fef7ff',
        cardBg: '#ffffff',
        text: '#92400e',
        subText: '#a78bfa',
        border: '#f3e8ff',
        primary: '#ec4899',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#f43f5e',
        shadow: '0 4px 6px rgba(236, 72, 153, 0.1)',
        hover: '#fdf4ff'
      },
      skeuomorphism: {
        bg: '#f0f0f0',
        cardBg: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
        text: '#333333',
        subText: '#666666',
        border: '#cccccc',
        primary: '#007aff',
        success: '#34c759',
        warning: '#ff9500',
        danger: '#ff3b30',
        shadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.1)',
        hover: '#f5f5f5'
      },
      dos: {
        bg: '#000080',
        cardBg: '#c0c0c0',
        text: '#000000',
        subText: '#404040',
        border: '#808080',
        primary: '#000080',
        success: '#008000',
        warning: '#808000',
        danger: '#800000',
        shadow: 'inset -1px -1px #000000, inset 1px 1px #ffffff',
        hover: '#d0d0d0'
      },
      bios: {
        bg: '#000000',
        cardBg: '#000080',
        text: '#ffffff',
        subText: '#c0c0c0',
        border: '#404040',
        primary: '#00ffff',
        success: '#00ff00',
        warning: '#ffff00',
        danger: '#ff0000',
        shadow: 'none',
        hover: '#000040'
      },
      code: {
        bg: '#1e1e1e',
        cardBg: '#2d2d30',
        text: '#d4d4d4',
        subText: '#808080',
        border: '#404040',
        primary: '#569cd6',
        success: '#4ec9b0',
        warning: '#dcdcaa',
        danger: '#f44747',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        hover: '#383838'
      }
    }
    return styles[currentStyle] || styles.modern
  }

  // 獲取桌位狀態顏色
  const getTableStatusColor = (status: TableStatus) => {
    const colors = getThemeColors()
    switch (status) {
      case 'available':
        return { bg: colors.success, text: '#ffffff', label: '空閒' }
      case 'occupied':
        return { bg: colors.warning, text: '#ffffff', label: '使用中' }
      case 'reserved':
        return { bg: colors.primary, text: '#ffffff', label: '已預約' }
      case 'cleaning':
        return { bg: colors.subText, text: '#ffffff', label: '清潔中' }
      case 'out_of_order':
        return { bg: colors.danger, text: '#ffffff', label: '停用' }
      default:
        return { bg: colors.subText, text: '#ffffff', label: '未知' }
    }
  }

  // 獲取今日預約列表
  const todayReservations = reservations.filter(reservation => {
    const reservationDate = new Date(reservation.reservation_time).toISOString().split('T')[0]
    return reservationDate === selectedDate && reservation.status !== 'cancelled'
  }).sort((a, b) => new Date(a.reservation_time).getTime() - new Date(b.reservation_time).getTime())

  // 格式化時間
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 計算到預約時間的倒計時
  const getCountdown = (reservationTime: string) => {
    const now = currentTime.getTime()
    const reservation = new Date(reservationTime).getTime()
    const diff = reservation - now
    
    if (diff <= 0) return '已過時'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`
    }
    return `${remainingMinutes}分`
  }

  const themeColors = getThemeColors()

  return (
    <div style={{
      minHeight: '100vh',
      background: themeColors.bg,
      color: themeColors.text,
      fontFamily: currentStyle === 'dos' || currentStyle === 'bios' ? 'monospace' : 'system-ui, sans-serif'
    }}>
      {/* 標題區域 */}
      <div style={{
        padding: '1rem',
        borderBottom: `1px solid ${themeColors.border}`,
        background: themeColors.cardBg,
        boxShadow: themeColors.shadow
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: themeColors.text
          }}>
            🪑 桌台管理
          </h1>
          
          {/* 日期和時間 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ color: themeColors.subText }}>今天</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                  background: themeColors.cardBg,
                  color: themeColors.text,
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{
              fontSize: '1rem',
              color: themeColors.subText
            }}>
              {currentTime.toLocaleTimeString('zh-TW')}
            </div>
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div style={{
        display: 'flex',
        maxWidth: '1400px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 80px)'
      }}>
        {/* 左側預約列表 */}
        <div style={{
          width: '400px',
          borderRight: `1px solid ${themeColors.border}`,
          background: themeColors.cardBg,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 預約標籤 */}
          <div style={{
            padding: '1rem',
            borderBottom: `1px solid ${themeColors.border}`,
            background: currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div style={{
                background: themeColors.primary,
                color: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: currentStyle === 'brutalism' ? `2px solid ${themeColors.border}` : 'none'
              }}>
                訂位 ({todayReservations.length})
              </div>
              <button
                onClick={() => setShowReservationModal(true)}
                style={{
                  background: themeColors.success,
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  boxShadow: currentStyle === 'brutalism' ? `2px 2px 0px ${themeColors.border}` : 'none'
                }}
              >
                + 新增預約
              </button>
            </div>

            {/* 篩選條件 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                background: themeColors.primary,
                color: '#ffffff',
                padding: '0.25rem 0.5rem',
                borderRadius: currentStyle === 'brutalism' ? '0' : '1rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                border: currentStyle === 'brutalism' ? `1px solid ${themeColors.border}` : 'none'
              }}>
                🔍 篩選條件
              </div>
              <input
                type="text"
                placeholder="搜尋......"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                  background: themeColors.bg,
                  color: themeColors.text,
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* 預約列表 */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '1rem'
          }}>
            {todayReservations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: themeColors.subText
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>今日暫無預約</div>
                <div style={{ fontSize: '0.875rem' }}>點擊上方按鈕新增預約</div>
              </div>
            ) : (
              todayReservations.map(reservation => {
                const countdown = getCountdown(reservation.reservation_time)
                const isActive = countdown !== '已過時' && parseInt(countdown) <= 30
                
                return (
                  <div
                    key={reservation.id}
                    style={{
                      padding: '1rem',
                      marginBottom: '1rem',
                      background: isActive ? `${themeColors.success}20` : themeColors.hover,
                      border: isActive ? `2px solid ${themeColors.success}` : `1px solid ${themeColors.border}`,
                      borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
                      boxShadow: currentStyle === 'brutalism' ? `2px 2px 0px ${themeColors.border}` : themeColors.shadow,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {/* 預約時間和倒數 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: themeColors.text
                      }}>
                        {formatTime(reservation.reservation_time)}
                      </div>
                      <div style={{
                        background: isActive ? themeColors.danger : themeColors.warning,
                        color: '#ffffff',
                        padding: '0.25rem 0.5rem',
                        borderRadius: currentStyle === 'brutalism' ? '0' : '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {countdown}
                      </div>
                    </div>

                    {/* 客戶資訊 */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: themeColors.text,
                        marginBottom: '0.25rem'
                      }}>
                        {reservation.customer_name}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: themeColors.subText,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>👥 {reservation.party_size}</span>
                        {reservation.table_number && (
                          <span>🪑 桌{reservation.table_number}</span>
                        )}
                      </div>
                    </div>

                    {/* 狀態按鈕 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        background: reservation.status === 'confirmed' ? themeColors.success : themeColors.warning,
                        color: '#ffffff',
                        padding: '0.25rem 0.75rem',
                        borderRadius: currentStyle === 'brutalism' ? '0' : '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        border: currentStyle === 'brutalism' ? `1px solid ${themeColors.border}` : 'none'
                      }}>
                        {reservation.status === 'confirmed' ? '已入座' : 
                         reservation.status === 'pending' ? '等待確認' :
                         reservation.status === 'seated' ? '已就座' : '未知'}
                      </div>
                      <button
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: themeColors.subText,
                          cursor: 'pointer',
                          fontSize: '1.125rem',
                          padding: '0.25rem'
                        }}
                      >
                        ⋯
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 右側桌台佈局 */}
        <div style={{
          flex: 1,
          padding: '2rem',
          background: themeColors.bg,
          position: 'relative'
        }}>
          {/* 桌台佈局區域 */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '600px'
          }}>
            {/* 方桌區域 */}
            <div style={{
              position: 'absolute',
              top: '50px',
              left: '50px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 120px)',
              gap: '30px'
            }}>
              {/* 方桌 4 */}
              <div style={{
                width: '120px',
                height: '120px',
                background: themeColors.cardBg,
                border: `2px solid ${themeColors.primary}`,
                borderRadius: currentStyle === 'brutalism' ? '0' : '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: themeColors.shadow,
                position: 'relative'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: themeColors.subText,
                  marginBottom: '0.25rem'
                }}>
                  方4
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  width: '20px',
                  height: '20px',
                  background: themeColors.success,
                  borderRadius: '50%',
                  border: `2px solid ${themeColors.cardBg}`
                }}></div>
              </div>

              {/* 空位 */}
              <div></div>

              {/* 方桌 6 */}
              <div style={{
                width: '120px',
                height: '120px',
                background: themeColors.success,
                border: `2px solid ${themeColors.border}`,
                borderRadius: currentStyle === 'brutalism' ? '0' : '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: themeColors.shadow,
                position: 'relative'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#ffffff',
                  marginBottom: '0.25rem'
                }}>
                  方6
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  background: themeColors.danger,
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: currentStyle === 'brutalism' ? '0' : '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  01:59
                </div>
              </div>

              {/* 方桌 2A */}
              <div style={{
                width: '120px',
                height: '80px',
                background: themeColors.cardBg,
                border: `2px solid ${themeColors.primary}`,
                borderRadius: currentStyle === 'brutalism' ? '0' : '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: themeColors.shadow
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: themeColors.subText
                }}>
                  方2A
                </div>
              </div>

              {/* 空位 */}
              <div></div>

              {/* 方桌 6B (拉高版本) */}
              <div style={{
                width: '120px',
                height: '180px',
                background: themeColors.cardBg,
                border: `2px solid ${themeColors.primary}`,
                borderRadius: currentStyle === 'brutalism' ? '0' : '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: themeColors.shadow
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: themeColors.subText
                }}>
                  方6B
                </div>
              </div>

              {/* 方桌 2B */}
              <div style={{
                width: '120px',
                height: '80px',
                background: themeColors.cardBg,
                border: `2px solid ${themeColors.primary}`,
                borderRadius: currentStyle === 'brutalism' ? '0' : '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: themeColors.shadow
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: themeColors.subText
                }}>
                  方2B
                </div>
              </div>
            </div>

            {/* 圓桌區域 */}
            <div style={{
              position: 'absolute',
              bottom: '100px',
              right: '100px'
            }}>
              {/* 圓桌 3 */}
              <div style={{
                width: '150px',
                height: '150px',
                background: themeColors.cardBg,
                border: `3px solid ${themeColors.primary}`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: themeColors.shadow
              }}>
                <div style={{
                  fontSize: '1rem',
                  color: themeColors.subText,
                  fontWeight: '500'
                }}>
                  圓3
                </div>
              </div>
            </div>
          </div>

          {/* 圖例 */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: themeColors.cardBg,
            border: `1px solid ${themeColors.border}`,
            borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
            padding: '1rem',
            boxShadow: themeColors.shadow,
            minWidth: '200px'
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: themeColors.text,
              marginBottom: '0.75rem'
            }}>
              桌台狀態
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {[
                { color: themeColors.success, label: '使用中' },
                { color: themeColors.primary, label: '空閒' },
                { color: themeColors.warning, label: '已預約' },
                { color: themeColors.subText, label: '清潔中' }
              ].map((status, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: status.color,
                    borderRadius: '50%'
                  }}></div>
                  <span style={{
                    fontSize: '0.75rem',
                    color: themeColors.text
                  }}>
                    {status.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
