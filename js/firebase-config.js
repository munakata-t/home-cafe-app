// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAdXQf05VDJsH84Gw_jdVJpivopuaq0h7M",
  authDomain: "mobile-order-app-6f839.firebaseapp.com",
  projectId: "mobile-order-app-6f839",
  storageBucket: "mobile-order-app-6f839.appspot.com",
  messagingSenderId: "645504503657",
  appId: "1:645504503657:web:2649f6032b279f873977f8",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);