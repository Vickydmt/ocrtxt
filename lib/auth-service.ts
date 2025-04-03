import { 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser as firebaseLogoutUser, 
  getCurrentUser 
} from "./firebase"
import type { User } from "firebase/auth"

// Login user
export async function loginUser(email: string, password: string): Promise<User> {
  try {
    const user = await loginWithEmail(email, password)
    if (!user) throw new Error("Login failed: User not found.")
    return user
  } catch (error: any) {
    console.error("Login error:", error.message)
    throw new Error(error.message)
  }
}

// Register user
export async function registerUser(name: string, email: string, password: string): Promise<User> {
  try {
    const user = await registerWithEmail(email, password)
    if (!user) throw new Error("Registration failed: User not created.")
    
    // In a real app, you would store the name in Firestore or Realtime Database
    return user
  } catch (error: any) {
    console.error("Registration error:", error.message)
    throw new Error(error.message)
  }
}

// Logout user
export async function logoutUser(): Promise<void> {
  try {
    await firebaseLogoutUser()
  } catch (error: any) {
    console.error("Logout error:", error.message)
    throw new Error(error.message)
  }
}

// Get current user
export { getCurrentUser }
