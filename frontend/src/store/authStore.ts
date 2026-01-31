import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  username: string | null
  email: string | null
  setAuth: (token: string, username: string, email: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      email: null,
      setAuth: (token, username, email) => {
        localStorage.setItem('token', token)
        set({ token, username, email })
      },
      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, username: null, email: null })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
