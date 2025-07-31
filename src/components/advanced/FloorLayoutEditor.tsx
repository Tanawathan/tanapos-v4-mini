import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

// 場地佈局相關類型定義
interface FloorPosition {
  x: number
  y: number
}

interface FloorTable {
  id: string
  table_number: number
  capacity: number
  position: FloorPosition
  width: number
  height: number
  rotation: number
  shape: 'rectangle' | 'circle' | 'square'
  status: 'available' | 'seated' | 'reserved' | 'ordered' | 'waiting_food' | 'needs_service' | 'cleaning' | 'out_of_order'
}

interface FloorLayout {
  id: string
  name: string
  width: number
  height: number
  tables: FloorTable[]
  obstacles: FloorObstacle[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface FloorObstacle {
  id: string
  type: 'wall' | 'pillar' | 'decoration' | 'entrance' | 'bar' | 'kitchen'
  position: FloorPosition
  width: number
  height: number
  rotation: number
  color: string
  label?: string
}

// 場地佈局編輯器組件
interface FloorLayoutEditorProps {
  currentLayout?: FloorLayout
  onSave: (layout: FloorLayout) => void
  onClose: () => void
  tables: any[]
}

export default function FloorLayoutEditor({ 
  currentLayout, 
  onSave, 
  onClose, 
  tables 
}: FloorLayoutEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [editMode, setEditMode] = useState<'select' | 'table' | 'obstacle'>('select')
  const [selectedElement, setSelectedElement] = useState<FloorTable | FloorObstacle | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<FloorPosition>({ x: 0, y: 0 })
  const [floorTables, setFloorTables] = useState<FloorTable[]>([])
  const [obstacles, setObstacles] = useState<FloorObstacle[]>([])
  const [layoutName, setLayoutName] = useState('')
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // 初始化佈局
  useEffect(() => {
    if (currentLayout) {
      setLayoutName(currentLayout.name)
      setFloorTables(currentLayout.tables)
      setObstacles(currentLayout.obstacles)
      setCanvasSize({ width: currentLayout.width, height: currentLayout.height })
    } else {
      // 從現有桌位創建初始佈局
      const initialTables: FloorTable[] = tables.map((table, index) => ({
        id: table.id,
        table_number: table.table_number,
        capacity: table.capacity,
        position: { 
          x: 100 + (index % 6) * 120, 
          y: 100 + Math.floor(index / 6) * 100 
        },
        width: table.capacity <= 2 ? 60 : table.capacity <= 4 ? 80 : 100,
        height: table.capacity <= 2 ? 60 : table.capacity <= 4 ? 80 : 100,
        rotation: 0,
        shape: table.capacity <= 2 ? 'circle' : 'rectangle',
        status: table.status
      }))
      setFloorTables(initialTables)
      setLayoutName('新佈局')
    }
  }, [currentLayout, tables])

  // 繪製場地佈局
  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空畫布
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)

    // 設置背景
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

    // 繪製網格
    drawGrid(ctx)

    // 繪製障礙物
    obstacles.forEach(obstacle => drawObstacle(ctx, obstacle))

    // 繪製桌位
    floorTables.forEach(table => drawTable(ctx, table))

    // 繪製選中元素的邊框
    if (selectedElement) {
      drawSelectionBorder(ctx, selectedElement)
    }
  }

  // 繪製網格
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSize = 20
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5

    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasSize.height)
      ctx.stroke()
    }

    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasSize.width, y)
      ctx.stroke()
    }
  }

  // 繪製桌位
  const drawTable = (ctx: CanvasRenderingContext2D, table: FloorTable) => {
    ctx.save()
    ctx.translate(table.position.x + table.width/2, table.position.y + table.height/2)
    ctx.rotate(table.rotation * Math.PI / 180)

    // 桌位顏色根據狀態
    const colors = {
      available: '#10b981',     // 綠色
      seated: '#f59e0b',        // 黃色
      reserved: '#3b82f6',      // 藍色
      ordered: '#8b5cf6',       // 紫色
      waiting_food: '#f97316',  // 橘色
      needs_service: '#ef4444', // 紅色
      cleaning: '#6b7280',      // 灰色
      out_of_order: '#374151'   // 暗灰
    }

    ctx.fillStyle = colors[table.status] || '#10b981'
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2

    if (table.shape === 'circle') {
      ctx.beginPath()
      ctx.arc(0, 0, table.width/2, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    } else {
      ctx.fillRect(-table.width/2, -table.height/2, table.width, table.height)
      ctx.strokeRect(-table.width/2, -table.height/2, table.width, table.height)
    }

    // 繪製桌號
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(table.table_number.toString(), 0, -5)
    
    // 繪製容量
    ctx.font = '10px Arial'
    ctx.fillText(`${table.capacity}人`, 0, 8)

    ctx.restore()
  }

  // 繪製障礙物
  const drawObstacle = (ctx: CanvasRenderingContext2D, obstacle: FloorObstacle) => {
    ctx.save()
    ctx.translate(obstacle.position.x + obstacle.width/2, obstacle.position.y + obstacle.height/2)
    ctx.rotate(obstacle.rotation * Math.PI / 180)

    ctx.fillStyle = obstacle.color
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1

    ctx.fillRect(-obstacle.width/2, -obstacle.height/2, obstacle.width, obstacle.height)
    ctx.strokeRect(-obstacle.width/2, -obstacle.height/2, obstacle.width, obstacle.height)

    // 繪製標籤
    if (obstacle.label) {
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(obstacle.label, 0, 0)
    }

    ctx.restore()
  }

  // 繪製選中邊框
  const drawSelectionBorder = (ctx: CanvasRenderingContext2D, element: FloorTable | FloorObstacle) => {
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    
    const pos = element.position
    const width = element.width
    const height = element.height
    
    ctx.strokeRect(pos.x, pos.y, width, height)
    ctx.setLineDash([])
  }

  // 畫布點擊事件
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (editMode === 'select') {
      // 選擇模式：查找點擊的元素
      const clickedTable = floorTables.find(table => 
        x >= table.position.x && x <= table.position.x + table.width &&
        y >= table.position.y && y <= table.position.y + table.height
      )

      const clickedObstacle = obstacles.find(obstacle =>
        x >= obstacle.position.x && x <= obstacle.position.x + obstacle.width &&
        y >= obstacle.position.y && y <= obstacle.position.y + obstacle.height
      )

      setSelectedElement(clickedTable || clickedObstacle || null)
    } else if (editMode === 'table') {
      // 添加桌位模式
      addNewTable(x, y)
    } else if (editMode === 'obstacle') {
      // 添加障礙物模式
      addNewObstacle(x, y)
    }
  }

  // 添加新桌位
  const addNewTable = (x: number, y: number) => {
    const newTable: FloorTable = {
      id: `table_${Date.now()}`,
      table_number: Math.max(...floorTables.map(t => t.table_number), 0) + 1,
      capacity: 4,
      position: { x: x - 40, y: y - 40 },
      width: 80,
      height: 80,
      rotation: 0,
      shape: 'rectangle',
      status: 'available'
    }
    setFloorTables([...floorTables, newTable])
  }

  // 添加新障礙物
  const addNewObstacle = (x: number, y: number) => {
    const newObstacle: FloorObstacle = {
      id: `obstacle_${Date.now()}`,
      type: 'wall',
      position: { x: x - 25, y: y - 25 },
      width: 50,
      height: 50,
      rotation: 0,
      color: '#6b7280',
      label: '牆'
    }
    setObstacles([...obstacles, newObstacle])
  }

  // 滑鼠按下事件
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (editMode !== 'select' || !selectedElement) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // 檢查是否點擊在選中元素上
    const pos = selectedElement.position
    if (x >= pos.x && x <= pos.x + selectedElement.width &&
        y >= pos.y && y <= pos.y + selectedElement.height) {
      setIsDragging(true)
      setDragOffset({
        x: x - pos.x,
        y: y - pos.y
      })
    }
  }

  // 滑鼠移動事件
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElement) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const newX = Math.max(0, Math.min(canvasSize.width - selectedElement.width, x - dragOffset.x))
    const newY = Math.max(0, Math.min(canvasSize.height - selectedElement.height, y - dragOffset.y))

    // 對齊到網格
    const gridSize = 20
    const alignedX = Math.round(newX / gridSize) * gridSize
    const alignedY = Math.round(newY / gridSize) * gridSize

    // 更新元素位置
    if ('table_number' in selectedElement) {
      // 是桌位
      setFloorTables(tables => 
        tables.map(table => 
          table.id === selectedElement.id 
            ? { ...table, position: { x: alignedX, y: alignedY } }
            : table
        )
      )
    } else {
      // 是障礙物
      setObstacles(obs => 
        obs.map(obstacle => 
          obstacle.id === selectedElement.id
            ? { ...obstacle, position: { x: alignedX, y: alignedY } }
            : obstacle
        )
      )
    }

    // 更新選中元素
    setSelectedElement({
      ...selectedElement,
      position: { x: alignedX, y: alignedY }
    })
  }

  // 滑鼠釋放事件
  const handleMouseUp = () => {
    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
  }

  // 刪除選中元素
  const deleteSelectedElement = () => {
    if (!selectedElement) return

    if ('table_number' in selectedElement) {
      setFloorTables(tables => tables.filter(table => table.id !== selectedElement.id))
    } else {
      setObstacles(obs => obs.filter(obstacle => obstacle.id !== selectedElement.id))
    }
    setSelectedElement(null)
  }

  // 保存佈局
  const saveLayout = async () => {
    const layout: FloorLayout = {
      id: currentLayout?.id || `layout_${Date.now()}`,
      name: layoutName,
      width: canvasSize.width,
      height: canvasSize.height,
      tables: floorTables,
      obstacles: obstacles,
      is_active: true,
      created_at: currentLayout?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    onSave(layout)
  }

  // 重繪畫布
  useEffect(() => {
    drawCanvas()
  }, [floorTables, obstacles, selectedElement, canvasSize])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full h-full max-h-[90vh] flex flex-col">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            場地佈局編輯器
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 工具面板 */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {/* 佈局設置 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                佈局設置
              </h3>
              <input
                type="text"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="佈局名稱"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* 編輯模式 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                編輯模式
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setEditMode('select')}
                  className={`w-full px-3 py-2 text-sm rounded-md ${
                    editMode === 'select' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🖱️ 選擇移動
                </button>
                <button
                  onClick={() => setEditMode('table')}
                  className={`w-full px-3 py-2 text-sm rounded-md ${
                    editMode === 'table' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🍽️ 添加桌位
                </button>
                <button
                  onClick={() => setEditMode('obstacle')}
                  className={`w-full px-3 py-2 text-sm rounded-md ${
                    editMode === 'obstacle' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🏗️ 添加設施
                </button>
              </div>
            </div>

            {/* 選中元素屬性 */}
            {selectedElement && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  屬性設置
                </h3>
                {'table_number' in selectedElement ? (
                  <TableProperties 
                    table={selectedElement}
                    onChange={(updatedTable) => {
                      setFloorTables(tables => 
                        tables.map(table => 
                          table.id === updatedTable.id ? updatedTable : table
                        )
                      )
                      setSelectedElement(updatedTable)
                    }}
                  />
                ) : (
                  <ObstacleProperties
                    obstacle={selectedElement}
                    onChange={(updatedObstacle) => {
                      setObstacles(obstacles => 
                        obstacles.map(obstacle => 
                          obstacle.id === updatedObstacle.id ? updatedObstacle : obstacle
                        )
                      )
                      setSelectedElement(updatedObstacle)
                    }}
                  />
                )}
                <button
                  onClick={deleteSelectedElement}
                  className="w-full mt-2 px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
                >
                  🗑️ 刪除
                </button>
              </div>
            )}

            {/* 畫布設置 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                畫布大小
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={canvasSize.width}
                  onChange={(e) => setCanvasSize(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                  placeholder="寬度"
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  value={canvasSize.height}
                  onChange={(e) => setCanvasSize(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                  placeholder="高度"
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>

          {/* 畫布區域 */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="cursor-crosshair"
                style={{ display: 'block' }}
              />
            </div>
          </div>
        </div>

        {/* 底部操作欄 */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500">
            當前模式: {editMode === 'select' ? '選擇移動' : editMode === 'table' ? '添加桌位' : '添加設施'}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={saveLayout}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              保存佈局
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 桌位屬性編輯組件
interface TablePropertiesProps {
  table: FloorTable
  onChange: (table: FloorTable) => void
}

function TableProperties({ table, onChange }: TablePropertiesProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">桌號</label>
        <input
          type="number"
          value={table.table_number}
          onChange={(e) => onChange({ ...table, table_number: parseInt(e.target.value) || 1 })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">容量</label>
        <select
          value={table.capacity}
          onChange={(e) => onChange({ ...table, capacity: parseInt(e.target.value) })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value={2}>2人桌</option>
          <option value={4}>4人桌</option>
          <option value={6}>6人桌</option>
          <option value={8}>8人桌</option>
          <option value={10}>10人桌</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">形狀</label>
        <select
          value={table.shape}
          onChange={(e) => onChange({ ...table, shape: e.target.value as 'rectangle' | 'circle' | 'square' })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="rectangle">長方形</option>
          <option value="circle">圓形</option>
          <option value="square">正方形</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">寬度</label>
          <input
            type="number"
            value={table.width}
            onChange={(e) => onChange({ ...table, width: parseInt(e.target.value) || 80 })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">高度</label>
          <input
            type="number"
            value={table.height}
            onChange={(e) => onChange({ ...table, height: parseInt(e.target.value) || 80 })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">旋轉角度</label>
        <input
          type="range"
          min="0"
          max="360"
          value={table.rotation}
          onChange={(e) => onChange({ ...table, rotation: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="text-xs text-center text-gray-500">{table.rotation}°</div>
      </div>
    </div>
  )
}

// 障礙物屬性編輯組件
interface ObstaclePropertiesProps {
  obstacle: FloorObstacle
  onChange: (obstacle: FloorObstacle) => void
}

function ObstacleProperties({ obstacle, onChange }: ObstaclePropertiesProps) {
  const obstacleTypes = [
    { value: 'wall', label: '牆壁', color: '#6b7280' },
    { value: 'pillar', label: '柱子', color: '#374151' },
    { value: 'decoration', label: '裝飾', color: '#10b981' },
    { value: 'entrance', label: '入口', color: '#3b82f6' },
    { value: 'bar', label: '吧台', color: '#8b5cf6' },
    { value: 'kitchen', label: '廚房', color: '#ef4444' }
  ]

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">類型</label>
        <select
          value={obstacle.type}
          onChange={(e) => {
            const type = e.target.value as FloorObstacle['type']
            const typeInfo = obstacleTypes.find(t => t.value === type)
            onChange({ 
              ...obstacle, 
              type,
              color: typeInfo?.color || '#6b7280',
              label: typeInfo?.label || ''
            })
          }}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          {obstacleTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">標籤</label>
        <input
          type="text"
          value={obstacle.label || ''}
          onChange={(e) => onChange({ ...obstacle, label: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">寬度</label>
          <input
            type="number"
            value={obstacle.width}
            onChange={(e) => onChange({ ...obstacle, width: parseInt(e.target.value) || 50 })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">高度</label>
          <input
            type="number"
            value={obstacle.height}
            onChange={(e) => onChange({ ...obstacle, height: parseInt(e.target.value) || 50 })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">顏色</label>
        <input
          type="color"
          value={obstacle.color}
          onChange={(e) => onChange({ ...obstacle, color: e.target.value })}
          className="w-full h-8 border border-gray-300 rounded"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">旋轉角度</label>
        <input
          type="range"
          min="0"
          max="360"
          value={obstacle.rotation}
          onChange={(e) => onChange({ ...obstacle, rotation: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="text-xs text-center text-gray-500">{obstacle.rotation}°</div>
      </div>
    </div>
  )
}
