import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// 擴展 Vitest 的 expect 功能
expect.extend(matchers)

// 每次測試後清理 DOM
afterEach(() => {
  cleanup()
})
