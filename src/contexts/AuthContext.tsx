import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface AuthContextType {
  isAuthenticated: boolean
  sessionToken: string | null
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  const createSession = useMutation(api.auth.createSession)
  const destroySession = useMutation(api.auth.destroySession)

  // Check for existing session token on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('authToken')
    if (storedToken) {
      setSessionToken(storedToken)
      setIsAuthenticated(true)
    }
  }, [])

  // Validate session token when it changes
  const isValidSession = useQuery(
    api.auth.validateSession,
    sessionToken ? { token: sessionToken } : 'skip'
  )

  // If session is invalid, clear it
  useEffect(() => {
    if (sessionToken && isValidSession === false) {
      setIsAuthenticated(false)
      setSessionToken(null)
      sessionStorage.removeItem('authToken')
    }
  }, [isValidSession, sessionToken])

  const login = async (password: string): Promise<boolean> => {
    try {
      const result = await createSession({ password })
      if (result.success && result.token) {
        setIsAuthenticated(true)
        setSessionToken(result.token)
        sessionStorage.setItem('authToken', result.token)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const logout = async (): Promise<void> => {
    if (sessionToken) {
      try {
        await destroySession({ token: sessionToken })
      } catch {
        // Ignore errors during logout
      }
    }
    setIsAuthenticated(false)
    setSessionToken(null)
    sessionStorage.removeItem('authToken')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, sessionToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Components that mirror Clerk's API for easy replacement
export function SignedIn({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : null
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? <>{children}</> : null
}
