// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrKRqie-spVFzFsAptzEsabZoJKVLDV2E",
  authDomain: "eventra-13b4c.firebaseapp.com",
  databaseURL: "https://eventra-13b4c-default-rtdb.firebaseio.com",
  projectId: "eventra-13b4c",
  storageBucket: "eventra-13b4c.firebasestorage.app",
  messagingSenderId: "443776709825",
  appId: "1:443776709825:web:dd9b2dd7765e35f28bd040",
  measurementId: "G-2D8D1KZ1WS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Lazy load messaging to avoid SSR issues
let messaging = null;
export const getMessagingInstance = () => {
  if (typeof window === 'undefined') return null;
  
  if (!messaging) {
    try {
      // Dynamic import to avoid SSR issues
      import('firebase/messaging').then(({ getMessaging }) => {
        messaging = getMessaging(app);
      });
    } catch (error) {
      console.warn('Firebase messaging not supported in this environment:', error);
    }
  }
  return messaging;
};

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Uncomment these lines if you want to use Firebase emulators
  // connectAuthEmulator(auth, "http://localhost:9099");
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectStorageEmulator(storage, "localhost", 9199);
}

// Firebase Cloud Messaging setup (lazy loaded)
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const messagingInstance = getMessagingInstance();
    if (!messagingInstance) return null;
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const { getToken } = await import('firebase/messaging');
      const token = await getToken(messagingInstance, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Handle foreground messages (lazy loaded)
export const onMessageListener = () => {
  if (typeof window === 'undefined') return Promise.resolve();
  
  return new Promise(async (resolve) => {
    try {
      const messagingInstance = getMessagingInstance();
      if (!messagingInstance) {
        resolve(null);
        return;
      }
      
      const { onMessage } = await import('firebase/messaging');
      onMessage(messagingInstance, (payload) => {
        resolve(payload);
      });
    } catch (error) {
      console.warn('Firebase messaging not available:', error);
      resolve(null);
    }
  });
};

export default app;
