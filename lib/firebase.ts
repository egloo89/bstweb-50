import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getFirestore, Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBWUagXX82GH3NFP9zMOiW4Mn0Izk9g3mY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bstweb-f9f6d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bstweb-f9f6d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bstweb-f9f6d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1040916102159",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1040916102159:web:be2c42e0e9358ccff0777a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-LJ7KV23B08",
}

// Log config status (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log("Firebase Config Status:", {
    apiKey: firebaseConfig.apiKey ? "✅ Loaded" : "❌ Missing",
    projectId: firebaseConfig.projectId ? "✅ Loaded" : "❌ Missing",
    usingEnv: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  })
}

// Initialize Firebase
let app: FirebaseApp
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig)
    console.log("Firebase initialized successfully")
  } catch (error) {
    console.error("Error initializing Firebase:", error)
    throw error
  }
} else {
  app = getApps()[0]
}

// Initialize Firestore
export const db: Firestore = getFirestore(app)

export default app

