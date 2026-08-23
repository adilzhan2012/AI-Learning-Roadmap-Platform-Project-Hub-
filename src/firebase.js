import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID && { measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID })
};

let app;
let auth;
let db;
let functions;
let storage;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  
  // App Check initialization
  if (import.meta.env.DEV) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (recaptchaKey) {
    if (typeof window !== 'undefined' && !window._appCheckInitialized) {
      window._appCheckInitialized = true;
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaKey),
        isTokenAutoRefreshEnabled: true
      });
    }
  } else {
    console.warn("VITE_RECAPTCHA_SITE_KEY is missing. App Check will not function properly in production.");
  }

  auth = getAuth(app);
  db = initializeFirestore(app, { 
    localCache: persistentLocalCache({ 
      tabManager: persistentMultipleTabManager() 
    }) 
  });
  functions = getFunctions(app);
  storage = getStorage(app);

  // Connect to Firebase Local Emulators if VITE_USE_EMULATORS is set
  if (import.meta.env.VITE_USE_EMULATORS === 'true' || import.meta.env.VITE_FIREBASE_EMULATOR === 'true') {
    console.log("⚡ Connecting to Firebase Local Emulators...");
    const { connectAuthEmulator } = await import('firebase/auth');
    const { connectFirestoreEmulator } = await import('firebase/firestore');
    const { connectFunctionsEmulator } = await import('firebase/functions');
    const { connectStorageEmulator } = await import('firebase/storage');

    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
  }

  // Initialize Analytics if supported
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
} catch (error) {
  console.error("Firebase initialization error", error);
}

export { 
  app, 
  auth, 
  db,
  functions,
  storage,
  analytics,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup
};

