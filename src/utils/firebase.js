import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase Configuration from your screenshot
const firebaseConfig = {
  apiKey: "AIzaSyDNYb6lzFIKlhJ0cihwpFCfmD8ykhzKWsc",
  authDomain: "money-statistics-ab2e2.firebaseapp.com",
  projectId: "money-statistics-ab2e2",
  storageBucket: "money-statistics-ab2e2.firebasestorage.app",
  messagingSenderId: "141246744654",
  appId: "1:141246744654:web:299b9d78cba065584fdb1f",
  measurementId: "G-DQK06C72L8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
