// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage"; // <- REMOVED: Cloudinary use ho raha hai

// Yaha apna copied config paste karein (yeh same rahega)
const firebaseConfig = {
  apiKey: "AIzaSyAsSI60w8sMu3Sx0TRrnHLp-Yda_KUGcuo",
  authDomain: "fuelxpress-77a49.firebaseapp.com",
  projectId: "fuelxpress-77a49",
  storageBucket: "fuelxpress-77a49.firebasestorage.app", 
  messagingSenderId: "646187900500",
  appId: "1:646187900500:web:8340b337f36badc6f797c1",
  measurementId: "G-PYL1GPEXFW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Services
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const storage export nahi kiya, kyunki ab hum Cloudinary use kar rahe hain.

export default app;