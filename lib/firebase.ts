import { initializeApp } from "firebase/app"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAW2lapzV00nxutaXCHuNwsYNXnTMgnKzE",
  authDomain: "login-78e38.firebaseapp.com",
  projectId: "login-78e38",
  storageBucket: "login-78e38.firebasestorage.app",
  messagingSenderId: "739641169342",
  appId: "1:739641169342:web:04b6fef292ebe0acee15ef",
}


// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// Authentication functions
export const loginWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const registerWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password)
}

export const logoutUser = () => {
  return signOut(auth)
}

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export { auth }

