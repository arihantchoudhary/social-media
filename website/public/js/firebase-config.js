// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAECqp7AvXrT14Jn2C3tAyXVjy7QcvAvZk",
    authDomain: "social-media-f4a57.firebaseapp.com",
    projectId: "social-media-f4a57",
    storageBucket: "social-media-f4a57.firebasestorage.app",
    messagingSenderId: "972576692145",
    appId: "1:972576692145:web:ed360b7eb4bfabcb95cf90"
  };
  
  // Initialize Firebase with compat libraries
  firebase.initializeApp(firebaseConfig);
  
  // Create auth and firestore references
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // Enable encryption for sensitive data
  const encryptionUtils = {
      // In a real app, use a proper encryption library
      encrypt: function(text) {
          return btoa(text + "_salted"); // Simple obfuscation, NOT secure encryption
      },
      
      decrypt: function(encryptedText) {
          try {
              const decrypted = atob(encryptedText);
              return decrypted.replace("_salted", "");
          } catch (e) {
              console.error('Decryption error:', e);
              return '';
          }
      }
  };