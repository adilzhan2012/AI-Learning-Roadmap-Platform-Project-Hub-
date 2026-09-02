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
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
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
  
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LfmGaUtAAAAAF1J_Ks6-pJjFWMe_3rpqAGznxFd";
  if (recaptchaKey) {
    if (typeof window !== 'undefined' && !window._appCheckInitialized) {
      window._appCheckInitialized = true;
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(recaptchaKey),
          isTokenAutoRefreshEnabled: true
        });
      } catch (appCheckErr) {
        console.warn("App Check initialization skipped or failed:", appCheckErr);
      }
    }
  }

  auth = getAuth(app);
  db = initializeFirestore(app, { 
    localCache: persistentLocalCache({ 
      tabManager: persistentMultipleTabManager() 
    }) 
  });
  functions = getFunctions(app);
  storage = getStorage(app);

  // Connect to Firebase Local Emulators in development
  if (import.meta.env.DEV) {
    if (typeof window !== 'undefined') {
      window.__debugFirebase = { functions, auth, db, httpsCallable, storage };
    }

    const emulatorHost = import.meta.env.VITE_EMULATOR_HOST || '127.0.0.1';

    // Full suite emulation flag
    const useAllEmulators = import.meta.env.VITE_USE_EMULATORS === 'true' || import.meta.env.VITE_FIREBASE_EMULATOR === 'true';

    // Functions emulator (active when full suite or VITE_USE_EMULATOR is set)
    if (useAllEmulators || import.meta.env.VITE_USE_EMULATOR === 'true') {
      console.log(`⚡ [Firebase] Connecting to Functions Emulator on ${emulatorHost}:5001`);
      connectFunctionsEmulator(functions, emulatorHost, 5001);
    }

    // Firestore emulator
    if (useAllEmulators || import.meta.env.VITE_USE_FIRESTORE_EMULATOR === 'true') {
      console.log(`⚡ [Firebase] Connecting to Firestore Emulator on ${emulatorHost}:8080`);
      connectFirestoreEmulator(db, emulatorHost, 8080);
    }

    // Auth emulator
    if (useAllEmulators || import.meta.env.VITE_USE_AUTH_EMULATOR === 'true') {
      console.log(`⚡ [Firebase] Connecting to Auth Emulator on http://${emulatorHost}:9099`);
      connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    }

    // Storage emulator
    if (useAllEmulators || import.meta.env.VITE_USE_STORAGE_EMULATOR === 'true') {
      console.log(`⚡ [Firebase] Connecting to Storage Emulator on ${emulatorHost}:9199`);
      connectStorageEmulator(storage, emulatorHost, 9199);
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

