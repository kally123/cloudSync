import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthState {
  token: string | null
  username: string | null
  email: string | null
  rememberMe: boolean
  setAuth: (token: string, username: string, email: string, rememberMe?: boolean) => void
  logout: () => void
}

// Helper to get the appropriate storage
const getStorage = () => {
  if (typeof window === 'undefined') return undefined
  const remembered = localStorage.getItem('rememberMe') === 'true'
  return remembered ? localStorage : sessionStorage
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      email: null,
      rememberMe: true,
      setAuth: (token, username, email, rememberMe = true) => {
        // Store rememberMe preference
        localStorage.setItem('rememberMe', String(rememberMe))
        
        // Store token in appropriate storage
        const storage = rememberMe ? localStorage : sessionStorage
        storage.setItem('token', token)
        
        // Clear from the other storage
        const otherStorage = rememberMe ? sessionStorage : localStorage
        otherStorage.removeItem('token')
        
        set({ token, username, email, rememberMe })
      },
      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('rememberMe')
        sessionStorage.removeItem('token')
        set({ token: null, username: null, email: null, rememberMe: true })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') return localStorage
        const remembered = localStorage.getItem('rememberMe') !== 'false'
        return remembered ? localStorage : sessionStorage
      }),
    }
  )
)
