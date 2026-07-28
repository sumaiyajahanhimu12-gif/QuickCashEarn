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

        // BAN PROTECTION

        if (data.status === "banned") {

            alert(
                "Your Account Has Been Suspended\n\nReason:\n" +
                (data.ban_reason || "Policy Violation")
            );

            await signOut(auth);

            window.location.href = "login.html";

            return;

        }

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

        const statusElement =
            document.getElementById(
                "accountStatus"
            );

        if (statusElement) {

            statusElement.innerText =
                data.status || "active";

        }

        // ADMIN PANEL BUTTON

        if (data.role === "admin") {

            const adminBtn =
                document.getElementById(
                    "adminPanelBtn"
                );

            if (adminBtn) {

                adminBtn.style.display =
                    "inline-block";

            }

        }

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

});

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

if (logoutBtn) {

    logoutBtn.addEventListener(
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

}
