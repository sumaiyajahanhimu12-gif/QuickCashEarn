import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {

        const data = userSnap.data();

        document.getElementById("welcomeText").innerText =
            "Welcome, " + data.username;

        document.getElementById("coinBalance").innerText =
            data.coin;

        document.getElementById("referralCode").innerText =
            data.referral_code;
    }

});

document.getElementById("logoutBtn").addEventListener(
    "click",
    async () => {

        await signOut(auth);

        window.location.href = "login.html";

    }
);
