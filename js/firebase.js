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

// নতুন ফায়ারবেস প্রজেক্টের কনফিগারেশন
const firebaseConfig = {
    apiKey: "AIzaSyAumEVLzqs-wrxXbbBqPeTIxBhfxA4d_a4",
    authDomain: "quick-cash-earn.firebaseapp.com",
    projectId: "quick-cash-earn",
    storageBucket: "quick-cash-earn.firebasestorage.app",
    messagingSenderId: "1056884667784",
    appId: "1:1056884667784:web:bd774d350f10457ec8b63d",
    measurementId: "G-EHJHZHPJ9V"
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
