import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// OYAGE FIREBASE CONFIG DETAILS MEKATA DANNA
export const firebaseConfig = {
  apiKey: "AIzaSyBsuR6OCTL_fa5TLYeghx9YxO2JOiyKkQQ",
  authDomain: "elderly-care-7c713.firebaseapp.com",
  projectId: "elderly-care-7c713",
  storageBucket: "elderly-care-7c713.firebasestorage.app",
  messagingSenderId: "315836499085",
  appId: "1:315836499085:web:8e7d6ea9e4f6a9997b4ec4",
  databaseURL: "https://elderly-care-7c713-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);
