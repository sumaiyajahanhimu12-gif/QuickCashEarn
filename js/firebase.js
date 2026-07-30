import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendEmailVerification, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    collection, 
    query, 
    where, 
    updateDoc, 
    increment, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBLULYy8cH0O1pCqygTTgLUvmlWFEMk-9Y",
    authDomain: "quickcashearn-2477f.firebaseapp.com",
    projectId: "quickcashearn-2477f",
    storageBucket: "quickcashearn-2477f.firebasestorage.app",
    messagingSenderId: "573761874377",
    appId: "1:573761874377:web:3aa98c3062bcd9aff1a018",
    measurementId: "G-X7TD58F2K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    onAuthStateChanged,
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    updateDoc,
    increment,
    addDoc,
    serverTimestamp
};
