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
  signInWithPopup,
  connectAuthEmulator
} from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
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

  // Connect to local Firebase Emulators in development when explicitly enabled
  if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
    const emulatorHost = import.meta.env.VITE_EMULATOR_HOST || 'localhost';
    console.log(`[Firebase] Connecting to Functions Emulator on ${emulatorHost}:5001`);
    connectFunctionsEmulator(functions, emulatorHost, 5001);

    if (import.meta.env.VITE_USE_FIRESTORE_EMULATOR === 'true') {
      console.log(`[Firebase] Connecting to Firestore Emulator on ${emulatorHost}:8080`);
      connectFirestoreEmulator(db, emulatorHost, 8080);
    }

    if (import.meta.env.VITE_USE_AUTH_EMULATOR === 'true') {
      console.log(`[Firebase] Connecting to Auth Emulator on http://${emulatorHost}:9099`);
      connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    }
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

