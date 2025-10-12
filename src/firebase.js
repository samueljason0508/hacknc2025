// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Paste your config here
const firebaseConfig = {
  apiKey: "AIzaSyA73jt2hkPrig4Ncn_GvRxqUzvs1GVjvr4",
  authDomain: "hacknc25-53dc3.firebaseapp.com",
  projectId: "hacknc25-53dc3",
storageBucket: "hacknc25-53dc3.appspot.com",
  messagingSenderId: "510242530025",
  appId: "1:510242530025:web:45ee4112465045fdea0678",
  measurementId: "G-K66FB2NB2C"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
