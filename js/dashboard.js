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

            await signOut(auth);

            alert("User Data Not Found");

            window.location.href =
                "login.html";

            return;

        }

        const data =
            userSnap.data();

        // BAN CHECK

        if (data.status === "banned") {

            await signOut(auth);

            alert(
                "Your Account Has Been Suspended\n\nReason:\n" +
                (data.ban_reason || "Policy Violation")
            );

            window.location.href =
                "login.html";

            return;

        }

        // USER INFO

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

        const accountStatus =
            document.getElementById(
                "accountStatus"
            );

        if (accountStatus) {

            accountStatus.innerText =
                data.status || "active";

        }

        // ADMIN PANEL

        const adminBtn =
            document.getElementById(
                "adminPanelBtn"
            );

        if (
            adminBtn &&
            data.role === "admin"
        ) {

            adminBtn.style.display =
                "inline-block";

        }

    } catch (error) {

        console.error(error);

        alert(
            "Dashboard Error\n\n" +
            error.message
        );

    }

});

// LOGOUT

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
