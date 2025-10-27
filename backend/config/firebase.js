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
    // Initialize Firebase Admin with service account credentials from environment variables
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const serviceAccount = {
        type: "service_account",
        project_id: firebaseConfig.projectId,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
      };
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: firebaseConfig.databaseURL,
        storageBucket: firebaseConfig.storageBucket
      });
      console.log('✅ Using Firebase service account credentials from environment variables');
    } else {
      console.log('Firebase service account credentials not found in environment variables, using project ID only');
      // Initialize with project ID only (for development)
      // This will use Application Default Credentials (ADC)
      firebaseApp = admin.initializeApp({
        projectId: firebaseConfig.projectId,
        databaseURL: firebaseConfig.databaseURL,
        storageBucket: firebaseConfig.storageBucket
      });
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
  async getCollection(collection, queryOptions = {}) {
    try {
      const snapshot = await database.ref(collection).once('value');
      let documents = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(key => {
          documents.push({ id: key, ...data[key] });
        });
      }

      // Apply client-side filtering for Realtime Database compatibility
      if (queryOptions.where) {
        queryOptions.where.forEach(([field, operator, value]) => {
          documents = documents.filter(doc => {
            switch (operator) {
              case '==':
                return doc[field] === value;
              case '!=':
                return doc[field] !== value;
              case 'array-contains':
                return Array.isArray(doc[field]) && doc[field].includes(value);
              case '>':
                return doc[field] > value;
              case '<':
                return doc[field] < value;
              case '>=':
                return doc[field] >= value;
              case '<=':
                return doc[field] <= value;
              case 'in':
                return Array.isArray(value) && value.includes(doc[field]);
              case 'not-in':
                return Array.isArray(value) && !value.includes(doc[field]);
              default:
                return true;
            }
          });
        });
      }

      // Apply sorting
      if (queryOptions.orderBy) {
        queryOptions.orderBy.forEach(([field, direction = 'asc']) => {
          documents.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            
            if (aVal === bVal) return 0;
            
            if (direction === 'desc') {
              return aVal > bVal ? -1 : 1;
            } else {
              return aVal > bVal ? 1 : -1;
            }
          });
        });
      }

      // Apply pagination
      if (queryOptions.offset || queryOptions.limit) {
        const offset = queryOptions.offset || 0;
        const limit = queryOptions.limit;
        
        if (limit) {
          documents = documents.slice(offset, offset + limit);
        } else {
          documents = documents.slice(offset);
        }
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

  // Specialized helper for chat room queries with multiple conditions
  async getChatRooms(userId, options = {}) {
    try {
      const snapshot = await database.ref('chat_rooms').once('value');
      let rooms = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(key => {
          const room = { id: key, ...data[key] };
          // Filter rooms where user is a participant
          if (Array.isArray(room.participants) && room.participants.includes(userId)) {
            rooms.push(room);
          }
        });
      }

      // Apply additional filters
      if (options.createdBy) {
        rooms = rooms.filter(room => room.createdBy === options.createdBy);
      }
      
      if (options.createdByNot) {
        rooms = rooms.filter(room => room.createdBy !== options.createdByNot);
      }

      // Sort by updatedAt desc by default
      rooms.sort((a, b) => {
        const aTime = a.updatedAt || a.createdAt || 0;
        const bTime = b.updatedAt || b.createdAt || 0;
        return bTime - aTime;
      });

      // Apply pagination
      if (options.limit) {
        const offset = options.offset || 0;
        rooms = rooms.slice(offset, offset + options.limit);
      }

      return rooms;
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      throw error;
    }
  },

  // Specialized helper for chat messages
  async getChatMessages(roomId, options = {}) {
    try {
      const snapshot = await database.ref('chat_messages').once('value');
      let messages = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(key => {
          const message = { id: key, ...data[key] };
          if (message.roomId === roomId) {
            messages.push(message);
          }
        });
      }

      // Sort by timestamp desc
      messages.sort((a, b) => {
        const aTime = a.timestamp || 0;
        const bTime = b.timestamp || 0;
        return bTime - aTime;
      });

      // Apply pagination
      if (options.limit) {
        const offset = options.offset || 0;
        messages = messages.slice(offset, offset + options.limit);
      }

      return messages;
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  },

  // Add database reference for direct access
  database
};

module.exports.firebaseHelpers = firebaseHelpers;
