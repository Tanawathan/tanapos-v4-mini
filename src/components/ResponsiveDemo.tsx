import React from 'react'
import { useResponsive, useResponsiveClasses, useResponsiveConfig } from '../hooks/useResponsive'

const ResponsiveDemo: React.FC = () => {
  const responsive = useResponsive()
  const classes = useResponsiveClasses()
  const config = useResponsiveConfig()

  const mockProducts = [
    { id: 1, name: '經典漢堡', description: '牛肉、生菜、番茄、洋蔥', price: 120 },
    { id: 2, name: '起司漢堡', description: '牛肉、起司、生菜、番茄', price: 140 },
    { id: 3, name: '雞肉漢堡', description: '炸雞、美乃滋、生菜、番茄', price: 130 },
    { id: 4, name: '薯條', description: '酥脆黃金薯條', price: 60 },
    { id: 5, name: '雞塊', description: '6塊炸雞塊', price: 80 },
    { id: 6, name: '可樂', description: '經典可樂 500ml', price: 25 },
  ]

  return (
    <div className="min-h-screen bg-background p-4">
      {/* 響應式信息面板 */}
      <div className="mb-8 p-4 bg-card rounded-lg border">
        <h2 className="text-xl font-bold mb-4">響應式信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>設備類型:</strong> {responsive.breakpoint}
            <br />
            <strong>螢幕尺寸:</strong> {responsive.screenWidth} × {responsive.screenHeight}
            <br />
            <strong>網格列數:</strong> {responsive.gridCols}
          </div>
          <div>
            <strong>卡片大小:</strong> {responsive.cardSize}
            <br />
            <strong>間距模式:</strong> {responsive.spacing}
            <br />
            <strong>橫屏模式:</strong> {responsive.isLandscape ? '是' : '否'}
          </div>
          <div>
            <strong>配置:</strong>
            <br />
            每頁項目: {config.itemsPerPage}
            <br />
            卡片高度: {config.cardHeight}
          </div>
        </div>
      </div>

      {/* 響應式佈局示例 */}
      <div className={classes.layout}>
        {/* 主要內容區域 */}
        <div className={classes.main}>
          <h1 className={classes.title}>響應式POS系統演示</h1>
          
          {/* 搜尋區域 */}
          <div className={classes.search}>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="搜尋商品..."
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                搜尋
              </button>
            </div>
          </div>

          {/* 分類按鈕 */}
          <div className={classes.categories}>
            {['全部', '主餐', '配菜', '飲料', '甜點'].map(category => (
              <button
                key={category}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg whitespace-nowrap"
              >
                {category}
              </button>
            ))}
          </div>

          {/* 商品網格 */}
          <div className={classes.grid}>
            {mockProducts.map(product => (
              <div
                key={product.id}
                className={classes.productCard}
                style={{ minHeight: config.cardHeight }}
              >
                <h3 className={`font-medium mb-2 ${classes.textBase}`}>
                  {product.name}
                </h3>
                <p className={`text-muted-foreground mb-3 ${classes.textSm}`}>
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-primary ${classes.textLg}`}>
                    NT$ {product.price}
                  </span>
                  <button className={`bg-primary text-primary-foreground px-3 py-1 rounded ${classes.textSm}`}>
                    加入
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 購物車區域 */}
        <div className={classes.cart}>
          <div className="pos-cart-header p-4 border-b">
            <h2 className={`font-bold ${classes.textLg}`}>購物車</h2>
          </div>
          <div className="p-4">
            <div className="text-center py-8">
              <div className="text-4xl mb-2 opacity-20">🛒</div>
              <p className={`text-muted-foreground ${classes.textSm}`}>
                購物車是空的
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 設備特定顯示 */}
      <div className="mt-8 space-y-2">
        <div className={classes.mobileOnly}>
          <div className="p-4 bg-green-100 text-green-800 rounded-lg">
            📱 手機端專用內容
          </div>
        </div>
        <div className={classes.tabletOnly}>
          <div className="p-4 bg-blue-100 text-blue-800 rounded-lg">
            📺 平板端專用內容
          </div>
        </div>
        <div className={classes.desktopOnly}>
          <div className="p-4 bg-purple-100 text-purple-800 rounded-lg">
            🖥️ 桌面端專用內容
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponsiveDemo
