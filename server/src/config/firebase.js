import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

let db;

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    const apps = getApps();
    let app;
    if (apps.length === 0) {
      app = initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      app = apps[0];
    }
    
    console.log('Firebase Admin SDK initialized using serviceAccountKey.json');
    db = getFirestore(app);
  } else {
    throw new Error('Service account key file (server/serviceAccountKey.json) was not found.');
  }
} catch (error) {
  console.error('\n==================================================================');
  console.error('FIREBASE INITIALIZATION ERROR:');
  console.error(error.message);
  console.error('\nTO FIX THIS:');
  console.error('1. Go to Firebase Console -> Project Settings -> Service Accounts.');
  console.error('2. Click "Generate new private key" to download the JSON credentials file.');
  console.error('3. Save this file as "server/serviceAccountKey.json".');
  console.error('==================================================================\n');
  
  db = new Proxy({}, {
    get: function(target, prop) {
      throw new Error(`Firestore operations are disabled because Firebase Admin was not initialized. Please configure server/serviceAccountKey.json first.`);
    }
  });
}

export { db };
