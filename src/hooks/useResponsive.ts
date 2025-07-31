import { useState, useEffect } from 'react'

export type BreakpointType = 'mobile' | 'tablet' | 'desktop'

interface UseResponsiveReturn {
  breakpoint: BreakpointType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  screenHeight: number
  isLandscape: boolean
  gridCols: number
  cardSize: 'small' | 'medium' | 'large'
  spacing: 'compact' | 'normal' | 'comfortable'
}

/**
 * 響應式設計Hook
 * 提供螢幕尺寸檢測和響應式狀態管理
 */
export const useResponsive = (): UseResponsiveReturn => {
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [screenHeight, setScreenHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 768)

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
      setScreenHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    
    // 初始化時設定一次
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 判斷設備類型
  const isMobile = screenWidth < 640
  const isTablet = screenWidth >= 640 && screenWidth < 1024
  const isDesktop = screenWidth >= 1024
  const isLandscape = screenWidth > screenHeight

  // 判斷當前斷點
  const breakpoint: BreakpointType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'

  // 動態計算網格列數
  const getGridCols = (): number => {
    if (isMobile) {
      // 極小螢幕顯示1列，一般手機顯示2列
      return screenWidth < 360 ? 1 : 2
    } else if (isTablet) {
      return 3
    } else {
      // 桌面端根據螢幕寬度動態調整
      if (screenWidth >= 2560) return 8
      if (screenWidth >= 1920) return 6
      if (screenWidth >= 1440) return 5
      return 4
    }
  }

  // 動態計算卡片大小
  const getCardSize = (): 'small' | 'medium' | 'large' => {
    if (isMobile) return 'small'
    if (isTablet) return 'medium'
    return 'large'
  }

  // 動態計算間距
  const getSpacing = (): 'compact' | 'normal' | 'comfortable' => {
    if (isMobile) return 'compact'
    if (isTablet) return 'normal'
    return 'comfortable'
  }

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    screenHeight,
    isLandscape,
    gridCols: getGridCols(),
    cardSize: getCardSize(),
    spacing: getSpacing()
  }
}

/**
 * 響應式類別生成器Hook
 * 根據當前斷點生成對應的CSS類別
 */
export const useResponsiveClasses = () => {
  const { breakpoint, gridCols, cardSize, spacing } = useResponsive()

  const getLayoutClasses = () => {
    const baseClasses = 'flex'
    
    switch (breakpoint) {
      case 'mobile':
        return `${baseClasses} pos-layout-mobile`
      case 'tablet':
        return `${baseClasses} pos-layout-tablet h-screen`
      case 'desktop':
        return `${baseClasses} pos-layout-desktop h-screen`
      default:
        return baseClasses
    }
  }

  const getMainClasses = () => {
    const baseClasses = 'flex-1'
    const spacing = breakpoint === 'mobile' ? 'p-2' : breakpoint === 'tablet' ? 'p-4' : 'p-6'
    
    return `${baseClasses} ${spacing} pos-main-${breakpoint}`
  }

  const getCartClasses = () => {
    const baseClasses = 'pos-cart pos-cart-container border-l border-border bg-card/50'
    
    switch (breakpoint) {
      case 'mobile':
        return `${baseClasses} pos-cart-mobile`
      case 'tablet':
        return `${baseClasses} pos-cart-tablet w-80`
      case 'desktop':
        return `${baseClasses} pos-cart-desktop w-80`
      default:
        return baseClasses
    }
  }

  const getGridClasses = () => {
    return `grid gap-4 pos-products-grid-${breakpoint}`
  }

  const getProductCardClasses = () => {
    const baseClasses = 'pos-product-card cursor-pointer'
    const spacing = breakpoint === 'mobile' ? 'p-2' : breakpoint === 'tablet' ? 'p-3' : 'p-4'
    
    return `${baseClasses} pos-product-card-${breakpoint} ${spacing}`
  }

  const getTitleClasses = () => {
    const baseClasses = 'font-bold text-foreground mb-6'
    const size = breakpoint === 'mobile' ? 'text-lg' : breakpoint === 'tablet' ? 'text-xl' : 'text-2xl'
    
    return `${baseClasses} ${size} pos-title-${breakpoint}`
  }

  const getSearchClasses = () => {
    const baseClasses = 'mb-6'
    
    return `${baseClasses} pos-search-${breakpoint}`
  }

  const getCategoriesClasses = () => {
    const baseClasses = 'flex gap-2 mb-6'
    
    if (breakpoint === 'mobile') {
      return `${baseClasses} pos-categories-mobile overflow-x-auto pb-2`
    }
    
    return `${baseClasses} flex-wrap`
  }

  return {
    layout: getLayoutClasses(),
    main: getMainClasses(),
    cart: getCartClasses(),
    grid: getGridClasses(),
    productCard: getProductCardClasses(),
    title: getTitleClasses(),
    search: getSearchClasses(),
    categories: getCategoriesClasses(),
    
    // 響應式文字類別
    textSm: 'text-responsive-sm',
    textBase: 'text-responsive-base',
    textLg: 'text-responsive-lg',
    
    // 響應式間距類別
    spacing: 'spacing-responsive',
    
    // 顯示/隱藏類別
    mobileOnly: 'mobile-only',
    tabletOnly: 'tablet-only',
    desktopOnly: 'desktop-only'
  }
}

/**
 * 響應式配置Hook
 * 提供不同設備的配置參數
 */
export const useResponsiveConfig = () => {
  const { breakpoint, isMobile, isTablet, isDesktop } = useResponsive()

  const getConfig = () => {
    switch (breakpoint) {
      case 'mobile':
        return {
          // 商品網格配置
          gridColumns: 2,
          itemsPerPage: 8,
          cardHeight: '120px',
          cardPadding: '0.5rem',
          
          // 字體大小
          fontSize: {
            title: '1rem',
            cardTitle: '0.875rem',
            cardDesc: '0.75rem',
            price: '1rem'
          },
          
          // 間距
          spacing: {
            container: '0.5rem',
            grid: '0.5rem',
            card: '0.25rem'
          },
          
          // 購物車配置
          cart: {
            position: 'bottom',
            height: '200px',
            width: '100%'
          },
          
          // 搜尋配置
          search: {
            layout: 'vertical',
            showFilters: false
          }
        }
      
      case 'tablet':
        return {
          gridColumns: 3,
          itemsPerPage: 12,
          cardHeight: '140px',
          cardPadding: '0.75rem',
          
          fontSize: {
            title: '1.125rem',
            cardTitle: '1rem',
            cardDesc: '0.875rem',
            price: '1.125rem'
          },
          
          spacing: {
            container: '0.75rem',
            grid: '0.75rem',
            card: '0.5rem'
          },
          
          cart: {
            position: 'right',
            height: '100vh',
            width: '300px'
          },
          
          search: {
            layout: 'horizontal',
            showFilters: true
          }
        }
      
      case 'desktop':
        return {
          gridColumns: 4,
          itemsPerPage: 16,
          cardHeight: '160px',
          cardPadding: '1rem',
          
          fontSize: {
            title: '1.25rem',
            cardTitle: '1rem',
            cardDesc: '0.875rem',
            price: '1.25rem'
          },
          
          spacing: {
            container: '1rem',
            grid: '1rem',
            card: '0.75rem'
          },
          
          cart: {
            position: 'right',
            height: '100vh',
            width: '320px'
          },
          
          search: {
            layout: 'horizontal',
            showFilters: true
          }
        }
      
      default:
        return {
          gridColumns: 4,
          itemsPerPage: 16,
          cardHeight: '160px',
          cardPadding: '1rem',
          
          fontSize: {
            title: '1.25rem',
            cardTitle: '1rem',
            cardDesc: '0.875rem',
            price: '1.25rem'
          },
          
          spacing: {
            container: '1rem',
            grid: '1rem',
            card: '0.75rem'
          },
          
          cart: {
            position: 'right',
            height: '100vh',
            width: '320px'
          },
          
          search: {
            layout: 'horizontal',
            showFilters: true
          }
        }
    }
  }

  return {
    ...getConfig(),
    breakpoint,
    isMobile,
    isTablet,
    isDesktop
  }
}
