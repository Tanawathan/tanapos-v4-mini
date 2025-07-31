// TanaPOS V4-Mini 庫存管理主頁面
// 三層架構庫存管理 - 原物料 → 半成品 → 成品
// 完全整合 UI Style 系統

import React, { useState, useEffect } from 'react'
import { useUIStyle } from '../../contexts/UIStyleContext'
import { usePOSStore } from '../../lib/store-complete'

// 三層庫存類型定義
interface RawMaterial {
  id: string
  name: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  cost: number
  supplier?: string
  expiryDate?: string
  storageLocation?: string
  lastRestockDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface SemiFinishedProduct {
  id: string
  name: string
  category: string
  unit: string
  actualStock: number
  minActualStock: number
  virtualStock: number
  totalAvailable: number
  preparationTime: number
  shelfLife: number
  actualCost: number
  virtualCost: number
  autoRestock: boolean
  restockThreshold: number
  recipeId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface FinishedProduct {
  id: string
  name: string
  category: string
  price: number
  totalCost: number
  rawMaterialCost: number
  semiProductCost: number
  margin: number
  actualStock: number
  virtualStock: number
  totalAvailable: number
  preparationTime: number
  recipeId?: string
  isAvailable: boolean
  availabilityReason?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

// 主要組件
export default function InventoryManagement() {
  const { currentStyle } = useUIStyle()
  const [activeTab, setActiveTab] = useState<'raw' | 'semi' | 'finished'>('raw')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // 模擬資料
  const [rawMaterials] = useState<RawMaterial[]>([
    {
      id: '1',
      name: '雞胸肉',
      category: '肉類',
      unit: '公斤',
      currentStock: 15.5,
      minStock: 5,
      maxStock: 50,
      cost: 180,
      supplier: '優質肉品供應商',
      expiryDate: '2025-08-05',
      storageLocation: '冷藏庫A',
      lastRestockDate: '2025-07-28',
      isActive: true,
      createdAt: '2025-07-01T00:00:00Z',
      updatedAt: '2025-07-31T00:00:00Z'
    },
    {
      id: '2',
      name: '洋蔥',
      category: '蔬菜',
      unit: '公斤',
      currentStock: 8.2,
      minStock: 3,
      maxStock: 20,
      cost: 35,
      supplier: '新鮮蔬果',
      expiryDate: '2025-08-10',
      storageLocation: '蔬果區',
      lastRestockDate: '2025-07-30',
      isActive: true,
      createdAt: '2025-07-01T00:00:00Z',
      updatedAt: '2025-07-31T00:00:00Z'
    },
    {
      id: '3',
      name: '醬油',
      category: '調料',
      unit: '瓶',
      currentStock: 2,
      minStock: 5,
      maxStock: 20,
      cost: 45,
      supplier: '調味專家',
      storageLocation: '調料櫃',
      lastRestockDate: '2025-07-25',
      isActive: true,
      createdAt: '2025-07-01T00:00:00Z',
      updatedAt: '2025-07-31T00:00:00Z'
    }
  ])

  const [semiProducts] = useState<SemiFinishedProduct[]>([
    {
      id: '1',
      name: '炒雞肉絲',
      category: '主料',
      unit: '份',
      actualStock: 12,
      minActualStock: 5,
      virtualStock: 25,
      totalAvailable: 37,
      preparationTime: 15,
      shelfLife: 4,
      actualCost: 85,
      virtualCost: 90,
      autoRestock: true,
      restockThreshold: 8,
      isActive: true,
      createdAt: '2025-07-01T00:00:00Z',
      updatedAt: '2025-07-31T00:00:00Z'
    },
    {
      id: '2',
      name: '爆炒洋蔥',
      category: '配菜',
      unit: '份',
      actualStock: 8,
      minActualStock: 3,
      virtualStock: 15,
      totalAvailable: 23,
      preparationTime: 10,
      shelfLife: 6,
      actualCost: 25,
      virtualCost: 28,
      autoRestock: false,
      restockThreshold: 5,
      isActive: true,
      createdAt: '2025-07-01T00:00:00Z',
      updatedAt: '2025-07-31T00:00:00Z'
    }
  ])

  const [finishedProducts] = useState<FinishedProduct[]>([
    {
      id: '1',
      name: '香煎雞胸套餐',
      category: '主餐',
      price: 280,
      totalCost: 145,
      rawMaterialCost: 95,
      semiProductCost: 50,
      margin: 48.2,
      actualStock: 5,
      virtualStock: 18,
      totalAvailable: 23,
      preparationTime: 20,
      isAvailable: true,
      createdAt: '2025-07-01T00:00:00Z',
      updatedAt: '2025-07-31T00:00:00Z'
    },
    {
      id: '2',
      name: '洋蔥雞肉炒飯',
      category: '主餐',
      price: 180,
      totalCost: 88,
      rawMaterialCost: 55,
      semiProductCost: 33,
      margin: 51.1,
      actualStock: 0,
      virtualStock: 12,
      totalAvailable: 12,
      preparationTime: 15,
      isAvailable: true,
      createdAt: '2025-07-01T00:00:00Z',
      updatedAt: '2025-07-31T00:00:00Z'
    }
  ])

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

  // 獲取庫存狀態顏色
  const getStockStatusColor = (current: number, min: number) => {
    const colors = getThemeColors()
    if (current <= 0) return { bg: colors.danger, text: '#ffffff', label: '缺貨' }
    if (current <= min) return { bg: colors.warning, text: '#ffffff', label: '低庫存' }
    return { bg: colors.success, text: '#ffffff', label: '充足' }
  }

  // 篩選函數
  const filterItems = (items: any[]) => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }

  // 獲取統計數據
  const getStats = () => {
    const lowStockRaw = rawMaterials.filter(item => item.currentStock <= item.minStock).length
    const lowStockSemi = semiProducts.filter(item => item.actualStock <= item.minActualStock).length
    const outOfStockFinished = finishedProducts.filter(item => item.totalAvailable <= 0).length
    
    return {
      totalRaw: rawMaterials.length,
      totalSemi: semiProducts.length,
      totalFinished: finishedProducts.length,
      lowStockRaw,
      lowStockSemi,
      outOfStockFinished,
      totalValue: rawMaterials.reduce((sum, item) => sum + (item.currentStock * item.cost), 0)
    }
  }

  const themeColors = getThemeColors()
  const stats = getStats()

  return (
    <div style={{
      minHeight: '100vh',
      background: themeColors.bg,
      color: themeColors.text,
      fontFamily: currentStyle === 'dos' || currentStyle === 'bios' ? 'monospace' : 'system-ui, sans-serif'
    }}>
      {/* 標題區域 */}
      <div style={{
        padding: '2rem',
        borderBottom: `1px solid ${themeColors.border}`,
        background: themeColors.cardBg,
        boxShadow: themeColors.shadow
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 'bold',
                color: themeColors.text,
                marginBottom: '0.5rem'
              }}>
                📦 庫存管理系統
              </h1>
              <p style={{
                margin: 0,
                color: themeColors.subText,
                fontSize: '1rem'
              }}>
                三層架構：原物料 → 半成品 → 成品
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setRefreshing(true)}
                style={{
                  background: themeColors.primary,
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  boxShadow: currentStyle === 'brutalism' ? `3px 3px 0px ${themeColors.border}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🔄 重新整理
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  background: themeColors.success,
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  boxShadow: currentStyle === 'brutalism' ? `3px 3px 0px ${themeColors.border}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ➕ 新增項目
              </button>
            </div>
          </div>

          {/* 統計卡片 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {[
              { label: '原物料總數', value: stats.totalRaw, icon: '📦', color: themeColors.primary },
              { label: '半成品總數', value: stats.totalSemi, icon: '🏭', color: themeColors.warning },
              { label: '成品總數', value: stats.totalFinished, icon: '🍽️', color: themeColors.success },
              { label: '低庫存警告', value: stats.lowStockRaw + stats.lowStockSemi, icon: '⚠️', color: themeColors.danger },
              { label: '庫存總價值', value: `$${stats.totalValue.toLocaleString()}`, icon: '💰', color: themeColors.primary }
            ].map((stat, index) => (
              <div
                key={index}
                style={{
                  background: themeColors.cardBg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.75rem',
                  padding: '1.5rem',
                  boxShadow: currentStyle === 'brutalism' ? `2px 2px 0px ${themeColors.border}` : themeColors.shadow,
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  color: stat.color,
                  marginBottom: '0.25rem'
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: themeColors.subText
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* 標籤切換 */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${themeColors.border}`,
          marginBottom: '2rem'
        }}>
          {[
            { id: 'raw', label: '原物料', icon: '📦' },
            { id: 'semi', label: '半成品', icon: '🏭' },
            { id: 'finished', label: '成品', icon: '🍽️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: activeTab === tab.id ? themeColors.primary : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : themeColors.text,
                borderBottom: activeTab === tab.id ? 'none' : `2px solid transparent`,
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem 0.5rem 0 0'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* 搜尋和篩選 */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="搜尋項目......"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${themeColors.border}`,
                borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
                background: themeColors.cardBg,
                color: themeColors.text,
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.75rem',
              border: `1px solid ${themeColors.border}`,
              borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
              background: themeColors.cardBg,
              color: themeColors.text,
              fontSize: '1rem',
              outline: 'none',
              minWidth: '150px'
            }}
          >
            <option value="all">所有分類</option>
            {activeTab === 'raw' && (
              <>
                <option value="肉類">肉類</option>
                <option value="蔬菜">蔬菜</option>
                <option value="調料">調料</option>
              </>
            )}
            {activeTab === 'semi' && (
              <>
                <option value="主料">主料</option>
                <option value="配菜">配菜</option>
              </>
            )}
            {activeTab === 'finished' && (
              <>
                <option value="主餐">主餐</option>
                <option value="小食">小食</option>
                <option value="飲品">飲品</option>
              </>
            )}
          </select>
        </div>

        {/* 項目列表 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* 原物料列表 */}
          {activeTab === 'raw' && filterItems(rawMaterials).map(item => {
            const stockStatus = getStockStatusColor(item.currentStock, item.minStock)
            return (
              <div
                key={item.id}
                style={{
                  background: themeColors.cardBg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.75rem',
                  padding: '1.5rem',
                  boxShadow: currentStyle === 'brutalism' ? `3px 3px 0px ${themeColors.border}` : themeColors.shadow
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      color: themeColors.text,
                      marginBottom: '0.25rem'
                    }}>
                      {item.name}
                    </h3>
                    <div style={{
                      color: themeColors.subText,
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem'
                    }}>
                      {item.category} • {item.supplier}
                    </div>
                  </div>
                  <div style={{
                    background: stockStatus.bg,
                    color: stockStatus.text,
                    padding: '0.25rem 0.5rem',
                    borderRadius: currentStyle === 'brutalism' ? '0' : '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {stockStatus.label}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{
                      color: themeColors.subText,
                      fontSize: '0.75rem',
                      marginBottom: '0.25rem'
                    }}>
                      當前庫存
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: themeColors.text
                    }}>
                      {item.currentStock} {item.unit}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      color: themeColors.subText,
                      fontSize: '0.75rem',
                      marginBottom: '0.25rem'
                    }}>
                      單價成本
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: themeColors.primary
                    }}>
                      ${item.cost}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: themeColors.hover,
                  padding: '0.75rem',
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ color: themeColors.subText }}>庫存範圍</span>
                    <span style={{ color: themeColors.text }}>{item.minStock} - {item.maxStock} {item.unit}</span>
                  </div>
                  {item.expiryDate && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{ color: themeColors.subText }}>到期日</span>
                      <span style={{ color: themeColors.text }}>{new Date(item.expiryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button style={{
                    flex: 1,
                    background: themeColors.primary,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    調整庫存
                  </button>
                  <button style={{
                    background: themeColors.warning,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    進貨
                  </button>
                </div>
              </div>
            )
          })}

          {/* 半成品列表 */}
          {activeTab === 'semi' && filterItems(semiProducts).map(item => {
            const stockStatus = getStockStatusColor(item.actualStock, item.minActualStock)
            return (
              <div
                key={item.id}
                style={{
                  background: themeColors.cardBg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.75rem',
                  padding: '1.5rem',
                  boxShadow: currentStyle === 'brutalism' ? `3px 3px 0px ${themeColors.border}` : themeColors.shadow
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      color: themeColors.text,
                      marginBottom: '0.25rem'
                    }}>
                      {item.name}
                    </h3>
                    <div style={{
                      color: themeColors.subText,
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem'
                    }}>
                      {item.category} • 製作時間 {item.preparationTime}分鐘
                    </div>
                  </div>
                  <div style={{
                    background: stockStatus.bg,
                    color: stockStatus.text,
                    padding: '0.25rem 0.5rem',
                    borderRadius: currentStyle === 'brutalism' ? '0' : '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {stockStatus.label}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{
                      color: themeColors.subText,
                      fontSize: '0.75rem',
                      marginBottom: '0.25rem'
                    }}>
                      實際庫存
                    </div>
                    <div style={{
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      color: themeColors.text
                    }}>
                      {item.actualStock}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      color: themeColors.subText,
                      fontSize: '0.75rem',
                      marginBottom: '0.25rem'
                    }}>
                      虛擬庫存
                    </div>
                    <div style={{
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      color: themeColors.primary
                    }}>
                      {item.virtualStock}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      color: themeColors.subText,
                      fontSize: '0.75rem',
                      marginBottom: '0.25rem'
                    }}>
                      總可用
                    </div>
                    <div style={{
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      color: themeColors.success
                    }}>
                      {item.totalAvailable}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: themeColors.hover,
                  padding: '0.75rem',
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ color: themeColors.subText }}>製作成本</span>
                    <span style={{ color: themeColors.text }}>${item.actualCost}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ color: themeColors.subText }}>保存時間</span>
                    <span style={{ color: themeColors.text }}>{item.shelfLife}小時</span>
                  </div>
                  {item.autoRestock && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{ color: themeColors.subText }}>自動補製</span>
                      <span style={{ 
                        color: themeColors.success,
                        fontWeight: 'bold'
                      }}>
                        ✅ 閾值 {item.restockThreshold}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button style={{
                    flex: 1,
                    background: themeColors.success,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    生產
                  </button>
                  <button style={{
                    background: themeColors.primary,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    調整
                  </button>
                </div>
              </div>
            )
          })}

          {/* 成品列表 */}
          {activeTab === 'finished' && filterItems(finishedProducts).map(item => {
            const stockStatus = getStockStatusColor(item.totalAvailable, 1)
            return (
              <div
                key={item.id}
                style={{
                  background: themeColors.cardBg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.75rem',
                  padding: '1.5rem',
                  boxShadow: currentStyle === 'brutalism' ? `3px 3px 0px ${themeColors.border}` : themeColors.shadow
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      color: themeColors.text,
                      marginBottom: '0.25rem'
                    }}>
                      {item.name}
                    </h3>
                    <div style={{
                      color: themeColors.subText,
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem'
                    }}>
                      {item.category} • 出餐時間 {item.preparationTime}分鐘
                    </div>
                  </div>
                  <div style={{
                    background: item.isAvailable ? themeColors.success : themeColors.danger,
                    color: '#ffffff',
                    padding: '0.25rem 0.5rem',
                    borderRadius: currentStyle === 'brutalism' ? '0' : '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {item.isAvailable ? '可供應' : '無法供應'}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{
                      color: themeColors.subText,
                      fontSize: '0.75rem',
                      marginBottom: '0.25rem'
                    }}>
                      售價
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: themeColors.primary
                    }}>
                      ${item.price}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      color: themeColors.subText,
                      fontSize: '0.75rem',
                      marginBottom: '0.25rem'
                    }}>
                      總可用
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: themeColors.text
                    }}>
                      {item.totalAvailable} 份
                    </div>
                  </div>
                </div>

                <div style={{
                  background: themeColors.hover,
                  padding: '0.75rem',
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ color: themeColors.subText }}>總成本</span>
                    <span style={{ color: themeColors.text }}>${item.totalCost}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ color: themeColors.subText }}>利潤率</span>
                    <span style={{ 
                      color: item.margin > 40 ? themeColors.success : item.margin > 20 ? themeColors.warning : themeColors.danger,
                      fontWeight: 'bold'
                    }}>
                      {item.margin.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ color: themeColors.subText }}>實際庫存</span>
                    <span style={{ color: themeColors.text }}>{item.actualStock} 份</span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button style={{
                    flex: 1,
                    background: themeColors.primary,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    查看食譜
                  </button>
                  <button style={{
                    background: themeColors.warning,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    編輯
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 空狀態 */}
        {((activeTab === 'raw' && filterItems(rawMaterials).length === 0) ||
          (activeTab === 'semi' && filterItems(semiProducts).length === 0) ||
          (activeTab === 'finished' && filterItems(finishedProducts).length === 0)) && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: themeColors.subText
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>沒有找到項目</div>
            <div style={{ fontSize: '1rem' }}>請調整搜尋條件或新增項目</div>
          </div>
        )}
      </div>
    </div>
  )
}
