import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth"

// Your Firebase Configuration (Keeping your original credentials)
const firebaseConfig = {
  apiKey: "AIzaSyAW2lapzV00nxutaXCHuNwsYNXnTMgnKzE",
  authDomain: "login-78e38.firebaseapp.com",
  projectId: "login-78e38",
  storageBucket: "login-78e38.firebasestorage.app",
  messagingSenderId: "739641169342",
  appId: "1:739641169342:web:04b6fef292ebe0acee15ef",
}

// Initialize Firebase (Avoid duplicate initialization)
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)

// Authentication functions with error handling
export const loginWithEmail = async (email: string, password: string): Promise<User | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error("Login Error:", error.message)
    throw new Error(error.message)
  }
}

export const registerWithEmail = async (email: string, password: string): Promise<User | null> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error("Registration Error:", error.message)
    throw new Error(error.message)
  }
}

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error: any) {
    console.error("Logout Error:", error.message)
    throw new Error(error.message)
  }
}

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

// Export auth instance
export { auth }
