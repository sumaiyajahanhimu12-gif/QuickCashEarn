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
        await user.reload();
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }

        const data = userSnap.data();

        // Ban Check
        if (data.status === "banned") {
            await signOut(auth);
            alert("Account Suspended\nReason: " + (data.ban_reason || "Policy Violation"));
            window.location.href = "login.html";
            return;
        }

        // Email Verification Check
        if (!user.emailVerified) {
            await signOut(auth);
            alert("ইমেইল ভেরিফাই করুন");
            window.location.href = "login.html";
            return;
        }

        document.getElementById("welcomeText").innerText = "Welcome, " + (data.username || "User");
        document.getElementById("coinBalance").innerText = data.coin || 0;
        document.getElementById("referralCode").innerText = data.referral_code || "N/A";
        document.getElementById("activeDays").innerText = data.active_days || 0;
        document.getElementById("referralCount").innerText = data.referral_count || 0;
        document.getElementById("emailStatus").innerText = user.emailVerified ? "Verified ✅" : "Not Verified ❌";

        const adminBtn = document.getElementById("adminPanelBtn");
        if (adminBtn) {
            adminBtn.style.display = data.role === "admin" ? "inline-block" : "none";
            adminBtn.onclick = () => window.location.href = "admin/dashboard.html";
        }

    } catch (error) {
        console.error(error);
        alert("Dashboard Error: " + error.message);
    }
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "login.html";
    });
}
