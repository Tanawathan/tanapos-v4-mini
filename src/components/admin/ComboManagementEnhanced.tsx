import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Product {
  id: string
  name: string
  price: number
  category_id: string
}

interface Category {
  id: string
  name: string
}

interface ComboProduct {
  id: string
  name: string
  description: string
  price: number
  combo_type: 'fixed' | 'selectable'
  is_available: boolean
  preparation_time: number
}

interface ComboChoice {
  id: string
  combo_id: string
  category_id: string
  min_selections: number
  max_selections: number
  sort_order: number
  category_name?: string
}

interface ComboSetupForm {
  name: string
  description: string
  price: number
  combo_type: 'fixed' | 'selectable'
  preparation_time: number
  choices: {
    category_id: string
    min_selections: number
    max_selections: number
  }[]
}

const ComboManagementEnhanced: React.FC = () => {
  const [combos, setCombos] = useState<ComboProduct[]>([])
  const [comboChoices, setComboChoices] = useState<{ [comboId: string]: ComboChoice[] }>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // 表單狀態
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCombo, setEditingCombo] = useState<string | null>(null)
  const [formData, setFormData] = useState<ComboSetupForm>({
    name: '',
    description: '',
    price: 0,
    combo_type: 'selectable',
    preparation_time: 15,
    choices: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 載入套餐
      const { data: combosData, error: combosError } = await supabase
        .from('combo_products')
        .select('*')
        .order('name')

      if (combosError) throw combosError
      setCombos(combosData || [])

      // 載入套餐選擇規則
      const { data: choicesData, error: choicesError } = await supabase
        .from('combo_choices')
        .select(`
          *,
          categories(name)
        `)
        .order('sort_order')

      if (choicesError) {
        console.warn('載入套餐選擇規則失敗:', choicesError)
      } else {
        const choicesByCombo: { [comboId: string]: ComboChoice[] } = {}
        choicesData?.forEach(choice => {
          if (!choicesByCombo[choice.combo_id]) {
            choicesByCombo[choice.combo_id] = []
          }
          choicesByCombo[choice.combo_id].push({
            ...choice,
            category_name: choice.categories?.name
          })
        })
        setComboChoices(choicesByCombo)
      }

      // 載入分類和產品
      const [categoriesResult, productsResult] = await Promise.all([
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('products').select('id, name, price, category_id').eq('is_available', true)
      ])

      if (categoriesResult.error) throw categoriesResult.error
      if (productsResult.error) throw productsResult.error

      setCategories(categoriesResult.data || [])
      setProducts(productsResult.data || [])

    } catch (error) {
      console.error('載入資料失敗:', error)
      setMessage('載入資料失敗: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      combo_type: 'selectable',
      preparation_time: 15,
      choices: []
    })
    setEditingCombo(null)
    setShowCreateForm(false)
  }

  const handleCreateCombo = async () => {
    if (!formData.name || formData.price <= 0) {
      setMessage('請填寫套餐名稱和有效價格')
      return
    }

    if (formData.combo_type === 'selectable' && formData.choices.length === 0) {
      setMessage('可選擇套餐需要至少一個選擇規則')
      return
    }

    setLoading(true)
    try {
      // 創建套餐
      const { data: comboData, error: comboError } = await supabase
        .from('combo_products')
        .insert({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          combo_type: formData.combo_type,
          preparation_time: formData.preparation_time,
          is_available: true
        })
        .select()
        .single()

      if (comboError) throw comboError

      // 如果是可選擇套餐，創建選擇規則
      if (formData.combo_type === 'selectable' && formData.choices.length > 0) {
        const choicesInsert = formData.choices.map((choice, index) => ({
          combo_id: comboData.id,
          category_id: choice.category_id,
          min_selections: choice.min_selections,
          max_selections: choice.max_selections,
          sort_order: index + 1
        }))

        const { error: choicesError } = await supabase
          .from('combo_choices')
          .insert(choicesInsert)

        if (choicesError) throw choicesError
      }

      setMessage('套餐創建成功！')
      resetForm()
      loadData()
    } catch (error) {
      console.error('創建套餐失敗:', error)
      setMessage('創建套餐失敗: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCombo = (combo: ComboProduct) => {
    setFormData({
      name: combo.name,
      description: combo.description,
      price: combo.price,
      combo_type: combo.combo_type,
      preparation_time: combo.preparation_time,
      choices: comboChoices[combo.id]?.map(choice => ({
        category_id: choice.category_id,
        min_selections: choice.min_selections,
        max_selections: choice.max_selections
      })) || []
    })
    setEditingCombo(combo.id)
    setShowCreateForm(true)
  }

  const handleUpdateCombo = async () => {
    if (!editingCombo) return

    setLoading(true)
    try {
      // 更新套餐
      const { error: updateError } = await supabase
        .from('combo_products')
        .update({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          combo_type: formData.combo_type,
          preparation_time: formData.preparation_time
        })
        .eq('id', editingCombo)

      if (updateError) throw updateError

      // 刪除舊的選擇規則
      await supabase
        .from('combo_choices')
        .delete()
        .eq('combo_id', editingCombo)

      // 如果是可選擇套餐，創建新的選擇規則
      if (formData.combo_type === 'selectable' && formData.choices.length > 0) {
        const choicesInsert = formData.choices.map((choice, index) => ({
          combo_id: editingCombo,
          category_id: choice.category_id,
          min_selections: choice.min_selections,
          max_selections: choice.max_selections,
          sort_order: index + 1
        }))

        const { error: choicesError } = await supabase
          .from('combo_choices')
          .insert(choicesInsert)

        if (choicesError) throw choicesError
      }

      setMessage('套餐更新成功！')
      resetForm()
      loadData()
    } catch (error) {
      console.error('更新套餐失敗:', error)
      setMessage('更新套餐失敗: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCombo = async (comboId: string) => {
    if (!confirm('確定要刪除此套餐嗎？此操作無法撤銷。')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('combo_products')
        .delete()
        .eq('id', comboId)

      if (error) throw error

      setMessage('套餐刪除成功！')
      loadData()
    } catch (error) {
      console.error('刪除套餐失敗:', error)
      setMessage('刪除套餐失敗: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const addChoice = () => {
    setFormData(prev => ({
      ...prev,
      choices: [...prev.choices, { category_id: '', min_selections: 1, max_selections: 1 }]
    }))
  }

  const removeChoice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index)
    }))
  }

  const updateChoice = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => 
        i === index ? { ...choice, [field]: value } : choice
      )
    }))
  }

  const getCategoryProducts = (categoryId: string) => {
    return products.filter(p => p.category_id === categoryId)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '15px'
      }}>
        <h2 style={{ margin: 0, color: '#1f2937' }}>🍽️ 套餐管理</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={loading}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ➕ 新增套餐
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.includes('成功') ? '#dcfce7' : '#fef2f2',
          color: message.includes('成功') ? '#166534' : '#dc2626',
          border: `1px solid ${message.includes('成功') ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message}
        </div>
      )}

      {/* 套餐列表 */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#374151' }}>現有套餐</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            載入中...
          </div>
        ) : combos.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            color: '#6b7280'
          }}>
            尚無套餐，點擊上方按鈕創建第一個套餐
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '20px' 
          }}>
            {combos.map(combo => (
              <div key={combo.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#1f2937', fontSize: '18px' }}>
                      {combo.name}
                    </h4>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: combo.combo_type === 'selectable' ? '#dbeafe' : '#fef3c7',
                      color: combo.combo_type === 'selectable' ? '#1e40af' : '#92400e'
                    }}>
                      {combo.combo_type === 'selectable' ? '可選擇套餐' : '固定套餐'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEditCombo(combo)}
                      style={{
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDeleteCombo(combo.id)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      刪除
                    </button>
                  </div>
                </div>

                <p style={{ 
                  margin: '0 0 10px 0', 
                  color: '#6b7280', 
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {combo.description || '無描述'}
                </p>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  <span style={{ color: '#374151' }}>
                    💰 <strong>NT$ {combo.price}</strong>
                  </span>
                  <span style={{ color: '#6b7280' }}>
                    ⏱️ {combo.preparation_time} 分鐘
                  </span>
                </div>

                {/* 顯示選擇規則 */}
                {combo.combo_type === 'selectable' && comboChoices[combo.id] && (
                  <div style={{ 
                    backgroundColor: '#f8fafc',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '500', 
                      color: '#475569',
                      marginBottom: '8px'
                    }}>
                      選擇規則：
                    </div>
                    {comboChoices[combo.id].map((choice, index) => (
                      <div key={choice.id} style={{ 
                        fontSize: '12px', 
                        color: '#64748b',
                        marginBottom: '4px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>{choice.category_name}</span>
                        <span>
                          {choice.min_selections === choice.max_selections 
                            ? `選 ${choice.min_selections} 個`
                            : `選 ${choice.min_selections}-${choice.max_selections} 個`
                          }
                          ({getCategoryProducts(choice.category_id).length} 個選項)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 創建/編輯表單 */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>
              {editingCombo ? '編輯套餐' : '新增套餐'}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                套餐名稱 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="輸入套餐名稱"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                套餐描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="輸入套餐描述"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                  價格 (NT$) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                  製作時間 (分鐘)
                </label>
                <input
                  type="number"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: parseInt(e.target.value) || 15 }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  min="1"
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                套餐類型
              </label>
              <select
                value={formData.combo_type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  combo_type: e.target.value as 'fixed' | 'selectable',
                  choices: e.target.value === 'fixed' ? [] : prev.choices
                }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="selectable">可選擇套餐 - 顧客可以選擇不同組合</option>
                <option value="fixed">固定套餐 - 預設組合</option>
              </select>
            </div>

            {/* 選擇規則設定 */}
            {formData.combo_type === 'selectable' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <label style={{ fontWeight: '500', color: '#374151' }}>
                    選擇規則 *
                  </label>
                  <button
                    type="button"
                    onClick={addChoice}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ➕ 添加規則
                  </button>
                </div>

                {formData.choices.map((choice, index) => (
                  <div key={index} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '10px',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <span style={{ fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                        規則 {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeChoice(index)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        刪除
                      </button>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#6b7280' }}>
                        分類
                      </label>
                      <select
                        value={choice.category_id}
                        onChange={(e) => updateChoice(index, 'category_id', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      >
                        <option value="">選擇分類</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({getCategoryProducts(cat.id).length} 個產品)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#6b7280' }}>
                          最少選擇
                        </label>
                        <input
                          type="number"
                          value={choice.min_selections}
                          onChange={(e) => updateChoice(index, 'min_selections', parseInt(e.target.value) || 1)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                          min="1"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#6b7280' }}>
                          最多選擇
                        </label>
                        <input
                          type="number"
                          value={choice.max_selections}
                          onChange={(e) => updateChoice(index, 'max_selections', parseInt(e.target.value) || 1)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                          min={choice.min_selections}
                        />
                      </div>
                    </div>

                    {choice.category_id && (
                      <div style={{ 
                        marginTop: '10px', 
                        padding: '8px', 
                        backgroundColor: '#fff',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        此分類可選產品: {getCategoryProducts(choice.category_id).map(p => p.name).join(', ') || '無產品'}
                      </div>
                    )}
                  </div>
                ))}

                {formData.choices.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    color: '#92400e',
                    fontSize: '14px'
                  }}>
                    可選擇套餐需要至少一個選擇規則
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={resetForm}
                disabled={loading}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                取消
              </button>
              <button
                onClick={editingCombo ? handleUpdateCombo : handleCreateCombo}
                disabled={loading || !formData.name || formData.price <= 0}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: (loading || !formData.name || formData.price <= 0) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: (loading || !formData.name || formData.price <= 0) ? 0.6 : 1
                }}
              >
                {loading ? '處理中...' : (editingCombo ? '更新套餐' : '創建套餐')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComboManagementEnhanced
