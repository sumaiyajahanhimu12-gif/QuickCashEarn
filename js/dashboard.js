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

    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User data not found");

            await signOut(auth);

            window.location.href = "login.html";

            return;

        }

        const data =
            userSnap.data();

        document.getElementById(
            "welcomeText"
        ).innerText =
            "Welcome, " +
            (data.username || "User");

        document.getElementById(
            "coinBalance"
        ).innerText =
            data.coin || 0;

        document.getElementById(
            "referralCode"
        ).innerText =
            data.referral_code || "N/A";

        document.getElementById(
            "activeDays"
        ).innerText =
            data.active_days || 0;

        document.getElementById(
            "emailStatus"
        ).innerText =
            user.emailVerified
            ? "Verified ✅"
            : "Not Verified ❌";

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

});

document.getElementById(
    "logoutBtn"
).addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href =
                "login.html";

        } catch (error) {

            alert(error.message);

        }

    }
);
