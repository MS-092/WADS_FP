"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '../lib/api'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setLoading(false)
        return
      }

      // Verify token with backend
      const userData = await authAPI.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Auth check failed:', error)
      // Clear invalid token
      localStorage.removeItem('auth_token')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials.email, credentials.password)
      
      // Store token
      localStorage.setItem('auth_token', response.access_token)
      
      // Set user data
      setUser(response.user)
      setIsAuthenticated(true)
      
      // Redirect based on role
      if (response.user.role === 'admin' || response.user.role === 'agent') {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }
      
      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    setIsAuthenticated(false)
    router.push('/login')
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 