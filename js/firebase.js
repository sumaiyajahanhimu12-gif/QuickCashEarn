import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBLULYy8cH0O1pDqygTTgLUvmlWFEMk-9Y",
  authDomain: "quickcashearn-2477f.firebaseapp.com",
  projectId: "quickcashearn-2477f",
  storageBucket: "quickcashearn-2477f.firebasestorage.app",
  messagingSenderId: "573761874377",
  appId: "1:573761874377:web:3aa98c3062bcd9aff1a018"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
