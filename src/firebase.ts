import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missingConfigKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => typeof value !== 'string' || value.trim().length === 0)
  .map(([key]) => key)

if (missingConfigKeys.length > 0) {
  throw new Error(
    `Missing Firebase configuration: ${missingConfigKeys.join(', ')}`
  )
}

if (import.meta.env.DEV) {
  console.log('Firebase API key in use:', import.meta.env.VITE_FIREBASE_API_KEY)
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Authentication is required before protected routes load, so keep it in the
// entry module. Firestore is initialized separately by lazy-loaded data routes.
export const auth = getAuth(app)

export default app
