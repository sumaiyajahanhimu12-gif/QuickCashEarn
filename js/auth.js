import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    setDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.registerUser = async function () {

    const username = document.getElementById("username").value.trim();
    const telegramId = document.getElementById("telegramId").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const referralCode = document.getElementById("referralCode").value.trim();

    if (!username || !telegramId || !email || !password) {
        alert("Please fill all required fields");
        return;
    }

    try {

        const usersRef = collection(db, "users");

        const usernameSnap = await getDocs(
            query(usersRef, where("username", "==", username))
        );

        if (!usernameSnap.empty) {
            alert("Username already exists");
            return;
        }

        const telegramSnap = await getDocs(
            query(usersRef, where("telegram_id", "==", telegramId))
        );

        if (!telegramSnap.empty) {
            alert("Telegram ID already registered");
            return;
        }

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        await sendEmailVerification(user);

        const generatedReferralCode =
            "QCE-" +
            username.toUpperCase().substring(0, 4) +
            "-" +
            Math.floor(1000 + Math.random() * 9000);

        await setDoc(doc(db, "users", user.uid), {

            username: username,
            telegram_id: telegramId,
            email: email,

            coin: 0,

            referral_code: generatedReferralCode,

            referred_by: referralCode || "",

            active_days: 0,

            email_verified: false,

            telegram_verified: false,

            role: "user",

            created_at: new Date().toISOString()

        });

        alert(
            "Registration Successful.\n\nVerification email sent. Please check your inbox."
        );

        window.location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

};

window.loginUser = async function () {

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        if (!user.emailVerified) {

            alert(
                "Email not verified.\n\nPlease verify your email before using tasks and withdrawals."
            );

        }

        window.location.href = "dashboard.html";

    } catch (error) {

        alert(error.message);

    }

};
