import React from 'react'

function TestApp() {
  console.log('🎉 TestApp 組件已載入!')
  return (
    <div>
      <h1>TanaPOS V4-Mini 測試</h1>
      <p>測試成功!</p>
      <p>時間: {new Date().toLocaleString()}</p>
    </div>
  )
}

export default TestApp
