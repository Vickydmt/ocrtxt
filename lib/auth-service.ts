import { auth } from "@/services/firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth"

// Login user
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error("Login error:", error.code, error.message)

    switch (error.code) {
      case "auth/invalid-email":
        throw new Error("Invalid email format.")
      case "auth/user-not-found":
        throw new Error("No user found with this email.")
      case "auth/wrong-password":
        throw new Error("Incorrect password. Please try again.")
      default:
        throw new Error("Login failed. Please check your credentials and try again.")
    }
  }
}

// Register user
export const registerUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error("Registration error:", error.code, error.message)

    switch (error.code) {
      case "auth/email-already-in-use":
        throw new Error("Email is already registered. Please use a different email.")
      case "auth/weak-password":
        throw new Error("Password must be at least 6 characters.")
      default:
        throw new Error("Registration failed. Please try again.")
    }
  }
}

// Logout user
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error: any) {
    console.error("Logout error:", error.message)
    throw new Error("Logout failed. Please try again.")
  }
}

// Get the current user
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}
