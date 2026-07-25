import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.registerUser = async function () {

    const username = document.getElementById("username").value;
    const telegramId = document.getElementById("telegramId").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const referralCode = document.getElementById("referralCode").value;

    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            username: username,
            telegram_id: telegramId,
            email: email,
            coin: 0,
            referral_code: username,
            referred_by: referralCode || "",
            active_days: 0,
            created_at: new Date().toISOString()
        });

        alert("Registration Successful");

    } catch (error) {

        alert(error.message);

    }

};

window.loginUser = async function () {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        alert("Login Successful");

        window.location.href = "dashboard.html";

    } catch (error) {

        alert(error.message);

    }

};
