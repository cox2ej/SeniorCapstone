import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

function createMemoryStorage() {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(String(key), String(value))
    },
    removeItem: (key) => {
      data.delete(String(key))
    },
    clear: () => {
      data.clear()
    },
  }
}

if (!globalThis.localStorage || typeof globalThis.localStorage.setItem !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  })
}

afterEach(() => {
  cleanup()
  if (globalThis.localStorage && typeof globalThis.localStorage.clear === 'function') {
    globalThis.localStorage.clear()
  }
})
