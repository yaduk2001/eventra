const admin = require('firebase-admin');
require('dotenv').config();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase Admin SDK
let firebaseApp;
let firestore;
let auth;
let database;

try {
  // Check if Firebase is already initialized
  if (admin.apps.length === 0) {
    // Initialize Firebase Admin with service account (if available)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: firebaseConfig.databaseURL,
        storageBucket: firebaseConfig.storageBucket
      });
    } else {
      // Try to use the service account key file directly
      try {
        const serviceAccount = require('../eventra-13b4c-firebase-adminsdk-fbsvc-495d3b360f.json');
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: firebaseConfig.databaseURL,
          storageBucket: firebaseConfig.storageBucket
        });
        console.log('✅ Using Firebase service account key');
      } catch (serviceAccountError) {
        console.log('Service account key not found, using project ID only');
        // Initialize with project ID only (for development)
        // This will use Application Default Credentials (ADC)
        firebaseApp = admin.initializeApp({
          projectId: firebaseConfig.projectId,
          databaseURL: firebaseConfig.databaseURL,
          storageBucket: firebaseConfig.storageBucket
        });
      }
    }
  } else {
    firebaseApp = admin.app();
  }

  // Initialize Firebase services
  database = admin.database();
  auth = admin.auth();

  console.log('🔥 Firebase Admin SDK initialized successfully');
  console.log(`📊 Project ID: ${firebaseConfig.projectId}`);
  console.log(`🗄️ Using Firebase Realtime Database`);

} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw error;
}

// Export Firebase services
module.exports = {
  admin,
  firebaseApp,
  database,
  auth,
  firebaseConfig
};

// Helper functions for common Firebase operations
const firebaseHelpers = {
  // Create a new document in Realtime Database
  async createDocument(collection, data, docId = null) {
    try {
      if (docId) {
        await database.ref(`${collection}/${docId}`).set(data);
        return { id: docId };
      } else {
        const newRef = database.ref(collection).push();
        await newRef.set(data);
        return { id: newRef.key };
      }
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  },

  // Get a document from Realtime Database
  async getDocument(collection, docId) {
    try {
      const snapshot = await database.ref(`${collection}/${docId}`).once('value');
      if (snapshot.exists()) {
        return { id: docId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  },

  // Get all documents from a collection
  async getCollection(collection) {
    try {
      const snapshot = await database.ref(collection).once('value');
      const documents = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(key => {
          documents.push({ id: key, ...data[key] });
        });
      }
      return documents;
    } catch (error) {
      console.error('Error getting collection:', error);
      throw error;
    }
  },

  // Update a document in Realtime Database
  async updateDocument(collection, docId, data) {
    try {
      await database.ref(`${collection}/${docId}`).update(data);
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  // Delete a document from Realtime Database
  async deleteDocument(collection, docId) {
    try {
      await database.ref(`${collection}/${docId}`).remove();
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  // Verify Firebase ID token
  async verifyIdToken(idToken) {
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw error;
    }
  },

  // Add database reference for direct access
  database
};

module.exports.firebaseHelpers = firebaseHelpers;
