"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from './api'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Check if there's a token in localStorage
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.log('No auth token found in localStorage')
        setLoading(false)
        return
      }

      console.log('Found auth token, verifying with server...')
      // Verify token by getting current user
      const userData = await authAPI.getCurrentUser()
      console.log('Token verification successful, user:', userData?.email)
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      // Token is invalid or expired
      console.log('Token verification failed:', error.message)
      localStorage.removeItem('auth_token')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const userData = await authAPI.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
      return userData
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 