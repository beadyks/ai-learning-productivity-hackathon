/**
 * Test Setup File
 * Configures the testing environment for Vitest
 */

import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Web Speech API
const mockSpeechRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  onresult: null,
  onerror: null,
  onend: null,
}

const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => [
    { name: 'English Voice', lang: 'en-US', voiceURI: 'en-US-voice', default: true, localService: true },
    { name: 'Hindi Voice', lang: 'hi-IN', voiceURI: 'hi-IN-voice', default: false, localService: true },
  ]),
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null,
}

// Setup global mocks
// @ts-ignore
global.SpeechRecognition = vi.fn(() => mockSpeechRecognition)
// @ts-ignore
global.webkitSpeechRecognition = vi.fn(() => mockSpeechRecognition)
// @ts-ignore
global.speechSynthesis = mockSpeechSynthesis
// @ts-ignore
global.SpeechSynthesisUtterance = vi.fn()

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock Cache API
global.caches = {
  open: vi.fn(() => Promise.resolve({
    match: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    keys: vi.fn(() => Promise.resolve([])),
  })),
  delete: vi.fn(),
  has: vi.fn(),
  keys: vi.fn(),
  match: vi.fn(),
} as any


