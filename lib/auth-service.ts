import { loginWithEmail, registerWithEmail, logoutUser as firebaseLogoutUser, getCurrentUser } from "./firebase"
import type { User } from "firebase/auth"

// Login user
export async function loginUser(email: string, password: string): Promise<User> {
  try {
    const userCredential = await loginWithEmail(email, password)
    return userCredential.user
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

// Register user
export async function registerUser(name: string, email: string, password: string): Promise<User> {
  try {
    const userCredential = await registerWithEmail(email, password)

    // In a real app, you would store the user's name in a database or user profile
    // For now, we'll just return the user
    return userCredential.user
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}

// Logout user
export async function logoutUser(): Promise<void> {
  try {
    await firebaseLogoutUser()
  } catch (error) {
    console.error("Logout error:", error)
    throw error
  }
}

// Get current user
export { getCurrentUser }

