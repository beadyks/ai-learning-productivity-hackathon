/**
 * End-to-End User Journey Tests
 * 
 * These tests validate complete user workflows from start to finish:
 * 1. Authentication flow (signup/login/logout)
 * 2. Document upload to chat flow
 * 3. Voice interaction flow
 * 
 * Requirements: All requirements
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from '../../App'
import { ToastProvider } from '../../contexts/ToastContext'

// Mock AWS Amplify
vi.mock('aws-amplify/auth', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  fetchAuthSession: vi.fn(),
}))

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    })),
  },
}))

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
  onresult: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  onend: null as (() => void) | null,
}

const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => [
    { name: 'English Voice', lang: 'en-US', voiceURI: 'en-US-voice' },
    { name: 'Hindi Voice', lang: 'hi-IN', voiceURI: 'hi-IN-voice' },
  ]),
  speaking: false,
  pending: false,
  paused: false,
}

// Setup global mocks
beforeEach(() => {
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
})

afterEach(() => {
  vi.clearAllMocks()
})

const renderApp = () => {
  return render(
    <ToastProvider>
      <App />
    </ToastProvider>
  )
}

describe('E2E User Journey Tests', () => {
  describe('Journey 1: Complete Authentication Flow', () => {
    it('should allow user to sign up, login, and logout successfully', async () => {
      const { signUp, signIn, signOut, getCurrentUser } = await import('aws-amplify/auth')
      
      // Mock successful signup
      vi.mocked(signUp).mockResolvedValue({
        isSignUpComplete: true,
        nextStep: { signUpStep: 'DONE' },
        userId: 'test-user-id',
      } as any)

      // Mock successful signin
      vi.mocked(signIn).mockResolvedValue({
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      } as any)

      // Mock getCurrentUser
      vi.mocked(getCurrentUser).mockResolvedValue({
        username: 'testuser',
        userId: 'test-user-id',
      } as any)

      // Mock signOut
      vi.mocked(signOut).mockResolvedValue(undefined)

      renderApp()

      // Step 1: User should see login page initially
      await waitFor(() => {
        expect(screen.getByText(/sign in/i) || screen.getByText(/login/i)).toBeInTheDocument()
      })

      // Step 2: Navigate to signup
      const signupLink = screen.getByText(/sign up/i) || screen.getByText(/create account/i)
      fireEvent.click(signupLink)

      // Step 3: Fill signup form
      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)
        const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i)
        
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } })
      })

      // Step 4: Submit signup
      const signupButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signupButton)

      // Step 5: Verify signup was called
      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'test@example.com',
            password: 'TestPassword123!',
          })
        )
      })

      // Step 6: After signup, user should be able to login
      await waitFor(() => {
        const loginButton = screen.getByRole('button', { name: /sign in/i })
        fireEvent.click(loginButton)
      })

      // Step 7: Verify signin was called
      await waitFor(() => {
        expect(signIn).toHaveBeenCalled()
      })

      // Step 8: User should be redirected to dashboard after login
      await waitFor(() => {
        expect(
          screen.getByText(/dashboard/i) || 
          screen.getByText(/progress/i) ||
          screen.getByText(/welcome/i)
        ).toBeInTheDocument()
      })

      // Step 9: User logs out
      const logoutButton = screen.getByRole('button', { name: /logout/i }) || 
                          screen.getByText(/sign out/i)
      fireEvent.click(logoutButton)

      // Step 10: Verify signOut was called
      await waitFor(() => {
        expect(signOut).toHaveBeenCalled()
      })

      // Step 11: User should be redirected back to login
      await waitFor(() => {
        expect(screen.getByText(/sign in/i) || screen.getByText(/login/i)).toBeInTheDocument()
      })
    })

    it('should handle authentication errors gracefully', async () => {
      const { signIn } = await import('aws-amplify/auth')
      
      // Mock failed signin
      vi.mocked(signIn).mockRejectedValue(new Error('Invalid credentials'))

      renderApp()

      // Attempt login with invalid credentials
      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)
        const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i)
        
        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      })

      const loginButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(loginButton)

      // Should display error message
      await waitFor(() => {
        expect(
          screen.getByText(/invalid credentials/i) ||
          screen.getByText(/error/i) ||
          screen.getByText(/failed/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Journey 2: Document Upload to Chat Flow', () => {
    it('should allow user to upload document and use it in chat', async () => {
      const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth')
      const axios = (await import('axios')).default
      
      // Mock authenticated user
      vi.mocked(getCurrentUser).mockResolvedValue({
        username: 'testuser',
        userId: 'test-user-id',
      } as any)

      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: {
          accessToken: { toString: () => 'mock-token' },
          idToken: { toString: () => 'mock-id-token' },
        },
      } as any)

      // Mock API responses
      const mockAxiosInstance = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
      }

      vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any)

      // Mock pre-signed URL response
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          uploadUrl: 'https://s3.amazonaws.com/bucket/key',
          documentId: 'doc-123',
        },
        status: 200,
      })

      // Mock S3 upload
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response)
      )

      // Mock document processing completion
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { status: 'processed' },
        status: 200,
      })

      // Mock chat response
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          text: 'Based on your document, here is the answer...',
          sources: ['doc-123'],
          confidence: 0.95,
        },
        status: 200,
      })

      renderApp()

      // Step 1: Navigate to document upload page
      await waitFor(() => {
        const uploadLink = screen.getByText(/upload/i) || screen.getByText(/document/i)
        fireEvent.click(uploadLink)
      })

      // Step 2: Create and upload a file
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      await waitFor(() => {
        const uploadZone = screen.getByText(/drag.*drop/i) || screen.getByText(/upload/i)
        const input = uploadZone.closest('div')?.querySelector('input[type="file"]')
        
        if (input) {
          fireEvent.change(input, { target: { files: [file] } })
        }
      })

      // Step 3: Verify upload progress is shown
      await waitFor(() => {
        expect(
          screen.getByText(/uploading/i) ||
          screen.getByText(/progress/i) ||
          screen.getByRole('progressbar')
        ).toBeInTheDocument()
      })

      // Step 4: Wait for upload to complete
      await waitFor(() => {
        expect(
          screen.getByText(/success/i) ||
          screen.getByText(/uploaded/i) ||
          screen.getByText(/complete/i)
        ).toBeInTheDocument()
      }, { timeout: 5000 })

      // Step 5: Navigate to chat
      const chatLink = screen.getByText(/chat/i) || screen.getByText(/learning arena/i)
      fireEvent.click(chatLink)

      // Step 6: Send a message about the document
      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText(/message/i) || 
                           screen.getByRole('textbox')
        fireEvent.change(messageInput, { 
          target: { value: 'What does my document say about this topic?' } 
        })
      })

      const sendButton = screen.getByRole('button', { name: /send/i })
      fireEvent.click(sendButton)

      // Step 7: Verify AI response references the document
      await waitFor(() => {
        expect(screen.getByText(/based on your document/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should handle upload errors and allow retry', async () => {
      const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth')
      const axios = (await import('axios')).default
      
      // Mock authenticated user
      vi.mocked(getCurrentUser).mockResolvedValue({
        username: 'testuser',
        userId: 'test-user-id',
      } as any)

      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: {
          accessToken: { toString: () => 'mock-token' },
        },
      } as any)

      const mockAxiosInstance = {
        post: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      }

      vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any)

      // Mock failed upload
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Upload failed'))

      renderApp()

      // Navigate to upload page
      await waitFor(() => {
        const uploadLink = screen.getByText(/upload/i) || screen.getByText(/document/i)
        fireEvent.click(uploadLink)
      })

      // Attempt upload
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const uploadZone = screen.getByText(/drag.*drop/i) || screen.getByText(/upload/i)
      const input = uploadZone.closest('div')?.querySelector('input[type="file"]')
      
      if (input) {
        fireEvent.change(input, { target: { files: [file] } })
      }

      // Should show error message
      await waitFor(() => {
        expect(
          screen.getByText(/error/i) ||
          screen.getByText(/failed/i)
        ).toBeInTheDocument()
      })

      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('Journey 3: Voice Interaction Flow', () => {
    it('should allow user to interact using voice input and output', async () => {
      const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth')
      const axios = (await import('axios')).default
      
      // Mock authenticated user
      vi.mocked(getCurrentUser).mockResolvedValue({
        username: 'testuser',
        userId: 'test-user-id',
      } as any)

      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: {
          accessToken: { toString: () => 'mock-token' },
        },
      } as any)

      const mockAxiosInstance = {
        post: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      }

      vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any)

      // Mock chat response
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          text: 'Here is the answer to your question.',
          confidence: 0.9,
        },
        status: 200,
      })

      renderApp()

      // Step 1: Navigate to chat
      await waitFor(() => {
        const chatLink = screen.getByText(/chat/i) || screen.getByText(/learning arena/i)
        fireEvent.click(chatLink)
      })

      // Step 2: Click microphone button to start voice input
      await waitFor(() => {
        const micButton = screen.getByRole('button', { name: /microphone/i }) ||
                         screen.getByLabelText(/voice/i)
        fireEvent.click(micButton)
      })

      // Step 3: Verify speech recognition started
      expect(mockSpeechRecognition.start).toHaveBeenCalled()

      // Step 4: Simulate speech recognition result
      const mockResult = {
        results: [[{
          transcript: 'What is the capital of France?',
          confidence: 0.95,
        }]],
        resultIndex: 0,
      }

      if (mockSpeechRecognition.onresult && typeof mockSpeechRecognition.onresult === 'function') {
        mockSpeechRecognition.onresult(mockResult as any)
      }

      // Step 5: Verify transcript appears in input
      await waitFor(() => {
        const messageInput = screen.getByDisplayValue(/what is the capital/i) ||
                           screen.getByText(/what is the capital/i)
        expect(messageInput).toBeInTheDocument()
      })

      // Step 6: Send the voice message
      const sendButton = screen.getByRole('button', { name: /send/i })
      fireEvent.click(sendButton)

      // Step 7: Verify API was called
      await waitFor(() => {
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          expect.stringContaining('/chat'),
          expect.objectContaining({
            message: expect.stringContaining('capital'),
          })
        )
      })

      // Step 8: Verify response is displayed
      await waitFor(() => {
        expect(screen.getByText(/here is the answer/i)).toBeInTheDocument()
      })

      // Step 9: Verify text-to-speech is triggered
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled()
    })

    it('should handle voice recognition errors gracefully', async () => {
      const { getCurrentUser } = await import('aws-amplify/auth')
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        username: 'testuser',
        userId: 'test-user-id',
      } as any)

      renderApp()

      // Navigate to chat
      await waitFor(() => {
        const chatLink = screen.getByText(/chat/i) || screen.getByText(/learning arena/i)
        fireEvent.click(chatLink)
      })

      // Click microphone button
      const micButton = screen.getByRole('button', { name: /microphone/i }) ||
                       screen.getByLabelText(/voice/i)
      fireEvent.click(micButton)

      // Simulate recognition error
      if (mockSpeechRecognition.onerror && typeof mockSpeechRecognition.onerror === 'function') {
        mockSpeechRecognition.onerror({ error: 'no-speech' } as any)
      }

      // Should show error message and fallback to text input
      await waitFor(() => {
        expect(
          screen.getByText(/error/i) ||
          screen.getByText(/try again/i) ||
          screen.getByText(/text input/i)
        ).toBeInTheDocument()
      })
    })

    it('should support language switching for voice', async () => {
      const { getCurrentUser } = await import('aws-amplify/auth')
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        username: 'testuser',
        userId: 'test-user-id',
      } as any)

      renderApp()

      // Navigate to chat
      await waitFor(() => {
        const chatLink = screen.getByText(/chat/i) || screen.getByText(/learning arena/i)
        fireEvent.click(chatLink)
      })

      // Find language selector
      const languageSelector = screen.getByLabelText(/language/i) ||
                              screen.getByRole('combobox', { name: /language/i })
      
      // Switch to Hindi
      fireEvent.change(languageSelector, { target: { value: 'hi-IN' } })

      // Click microphone
      const micButton = screen.getByRole('button', { name: /microphone/i })
      fireEvent.click(micButton)

      // Verify speech recognition uses Hindi language
      expect(mockSpeechRecognition.lang).toBe('hi-IN')
    })
  })

  describe('Journey 4: Offline to Online Transition', () => {
    it('should queue messages offline and sync when online', async () => {
      const { getCurrentUser } = await import('aws-amplify/auth')
      const axios = (await import('axios')).default
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        username: 'testuser',
        userId: 'test-user-id',
      } as any)

      const mockAxiosInstance = {
        post: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      }

      vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any)

      renderApp()

      // Navigate to chat
      await waitFor(() => {
        const chatLink = screen.getByText(/chat/i)
        fireEvent.click(chatLink)
      })

      // Step 1: Go offline
      Object.defineProperty(global.navigator, 'onLine', {
        writable: true,
        value: false,
      })

      window.dispatchEvent(new Event('offline'))

      // Step 2: Verify offline banner appears
      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument()
      })

      // Step 3: Send a message while offline
      const messageInput = screen.getByPlaceholderText(/message/i)
      fireEvent.change(messageInput, { target: { value: 'Offline message' } })
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      fireEvent.click(sendButton)

      // Step 4: Message should be queued
      await waitFor(() => {
        expect(screen.getByText(/queued/i) || screen.getByText(/offline message/i)).toBeInTheDocument()
      })

      // Step 5: Go back online
      Object.defineProperty(global.navigator, 'onLine', {
        writable: true,
        value: true,
      })

      window.dispatchEvent(new Event('online'))

      // Step 6: Verify sync happens
      await waitFor(() => {
        expect(mockAxiosInstance.post).toHaveBeenCalled()
      }, { timeout: 5000 })
    })
  })
})
