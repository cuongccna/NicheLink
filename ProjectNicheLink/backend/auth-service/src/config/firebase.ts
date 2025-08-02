import admin from 'firebase-admin';
import { logger } from '../utils/logger';

// Firebase Admin SDK configuration
let firebaseApp: admin.app.App;

export const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      // Check if we have all required Firebase credentials
      const hasCredentials = process.env.FIREBASE_PROJECT_ID && 
                            process.env.FIREBASE_PRIVATE_KEY && 
                            process.env.FIREBASE_CLIENT_EMAIL;

      if (hasCredentials) {
        const serviceAccount = {
          type: process.env.FIREBASE_TYPE || 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
          token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
        };

        logger.info('Initializing Firebase with service account credentials...');
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } else {
        logger.warn('Firebase credentials not complete, initializing with project ID only...');
        firebaseApp = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'nichelink-dev'
        });
      }

      logger.info('Firebase Admin SDK initialized successfully');
    } else {
      firebaseApp = admin.app();
    }

    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error);
    throw error;
  }
};

export const getFirebaseApp = () => {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
};

export const getAuth = () => {
  return getFirebaseApp().auth();
};

export default {
  initializeFirebase,
  getFirebaseApp,
  getAuth
};
