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
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;
let db;
let functions;
let storage;

try {
  app = initializeApp(firebaseConfig);
  
  // App Check initialization
  if (import.meta.env.DEV) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (recaptchaKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaKey),
      isTokenAutoRefreshEnabled: true
    });
  } else {
    console.warn("VITE_RECAPTCHA_SITE_KEY is missing. App Check will not function properly.");
  }

  auth = getAuth(app);
  db = initializeFirestore(app, { 
    localCache: persistentLocalCache({ 
      tabManager: persistentMultipleTabManager() 
    }) 
  });
  functions = getFunctions(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization error", error);
}

export { 
  app, 
  auth, 
  db,
  functions,
  storage,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup
};

