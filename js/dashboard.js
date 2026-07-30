import {
    auth,
    db,
    onAuthStateChanged,
    signOut,
    doc,
    getDoc
} from "./firebase.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await signOut(auth);
            alert("User Data Not Found");
            window.location.href = "login.html";
            return;
        }

        const data = userSnap.data();

        // BAN CHECK
        if (data.status === "banned") {
            await signOut(auth);
            alert(
                "Your Account Has Been Suspended\n\nReason:\n" +
                (data.ban_reason || "Policy Violation")
            );
            window.location.href = "login.html";
            return;
        }

        // USER INFO SET
        const welcomeText = document.getElementById("welcomeText");
        if (welcomeText) {
            welcomeText.innerText = "Welcome, " + (data.username || "User");
        }

        const coinBalance = document.getElementById("coinBalance");
        if (coinBalance) {
            coinBalance.innerText = data.coin || 0;
        }

        const referralCode = document.getElementById("referralCode");
        if (referralCode) {
            referralCode.innerText = data.referral_code || "N/A";
        }

        const activeDays = document.getElementById("activeDays");
        if (activeDays) {
            activeDays.innerText = data.active_days || 0;
        }

        const emailStatus = document.getElementById("emailStatus");
        if (emailStatus) {
            emailStatus.innerText = user.emailVerified
                ? "Verified ✅"
                : "Not Verified ❌";
        }

        const accountStatus = document.getElementById("accountStatus");
        if (accountStatus) {
            accountStatus.innerText = data.status || "active";
        }

        // ADMIN PANEL BUTTON
        const adminBtn = document.getElementById("adminPanelBtn");
        if (adminBtn) {
            if (data.role === "admin") {
                adminBtn.style.display = "inline-block";
            } else {
                adminBtn.style.display = "none";
            }
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
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            alert(error.message);
        }
    });
}
