"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { loginUser, logoutUser, getCurrentUser } from "@/services/auth-service"
import type { User } from "firebase/auth"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  const login = async (email: string, password: string) => {
    const loggedInUser = await loginUser(email, password)
    setUser(loggedInUser)
  }

  const logout = async () => {
    await logoutUser()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
