import {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    onAuthStateChanged,
    doc,
    setDoc,
    updateDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "./firebase.js";

function getDeviceId() {
    let deviceId = localStorage.getItem("qce_device_id");
    if (!deviceId) {
        deviceId = (typeof crypto !== "undefined" && crypto.randomUUID)
            ? crypto.randomUUID()
            : "QCE-" + Date.now() + "-" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("qce_device_id", deviceId);
    }
    return deviceId;
}

function showMsg(id, text, color = "red") {
    const el = document.getElementById(id);
    if (el) {
        el.style.color = color;
        el.innerText = text;
    } else {
        alert(text);
    }
}

// ========== REGISTER ==========
async function registerUser() {
    const username = document.getElementById("username")?.value.trim() || "";
    const telegramId = document.getElementById("telegramId")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";
    const referralCode = document.getElementById("referralCode")?.value.trim() || "";

    if (!username || !telegramId || !email || !password) {
        showMsg("regMsg", "সব বাধ্যতামূলক ফিল্ড পূরণ করুন");
        return;
    }

    const btn = document.getElementById("registerBtn");
    if (btn) btn.disabled = true;

    try {
        const deviceId = getDeviceId();
        const usersRef = collection(db, "users");

        // One Device One Account
        const deviceSnap = await getDocs(query(usersRef, where("device_id", "==", deviceId)));
        if (!deviceSnap.empty) {
            showMsg("regMsg", "এক ডিভাইসে শুধুমাত্র একটি অ্যাকাউন্ট");
            if (btn) btn.disabled = false;
            return;
        }

        // Unique Username
        const usernameSnap = await getDocs(query(usersRef, where("username", "==", username)));
        if (!usernameSnap.empty) {
            showMsg("regMsg", "Username ইতিমধ্যে আছে");
            if (btn) btn.disabled = false;
            return;
        }

        // Unique Telegram ID
        const telegramSnap = await getDocs(query(usersRef, where("telegram_id", "==", telegramId)));
        if (!telegramSnap.empty) {
            showMsg("regMsg", "Telegram ID ইতিমধ্যে রেজিস্টার করা");
            if (btn) btn.disabled = false;
            return;
        }

        // Optional Referral
        let validReferral = "";
        if (referralCode) {
            const refSnap = await getDocs(query(usersRef, where("referral_code", "==", referralCode)));
            if (!refSnap.empty) validReferral = referralCode;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);

        const generatedCode = "QCE-" + username.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 4) + "-" + Math.floor(1000 + Math.random() * 9000);

        await setDoc(doc(db, "users", user.uid), {
            username,
            telegram_id: telegramId,
            device_id: deviceId,
            email,
            coin: 0,
            referral_code: generatedCode,
            referred_by: validReferral,
            referral_count: 0,
            active_days: 0,
            last_active_date: "",
            email_verified: false,
            role: "user",
            status: "active",
            ban_reason: "",
            created_at: new Date().toISOString()
        });

        showMsg("regMsg", "রেজিস্ট্রেশন সফল! ভেরিফিকেশন ইমেইল পাঠানো হয়েছে।", "green");
        setTimeout(() => window.location.href = "login.html", 2000);

    } catch (error) {
        console.error(error);
        showMsg("regMsg", error.message || "রেজিস্ট্রেশন ব্যর্থ");
        if (btn) btn.disabled = false;
    }
}

// ========== LOGIN ==========
async function loginUser() {
    const email = document.getElementById("loginEmail")?.value.trim() || "";
    const password = document.getElementById("loginPassword")?.value || "";

    if (!email || !password) {
        showMsg("loginMsg", "Email এবং Password দিন");
        return;
    }

    const btn = document.getElementById("loginBtn");
    if (btn) btn.disabled = true;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await user.reload();

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await signOut(auth);
            showMsg("loginMsg", "ইউজার ডেটা পাওয়া যায়নি");
            if (btn) btn.disabled = false;
            return;
        }

        const data = userSnap.data();

        // Ban Check
        if (data.status === "banned") {
            await signOut(auth);
            showMsg("loginMsg", "অ্যাকাউন্ট ব্যান করা হয়েছে\nReason: " + (data.ban_reason || "Policy Violation"));
            if (btn) btn.disabled = false;
            return;
        }

        // Device Check
        const savedDevice = localStorage.getItem("qce_device_id");
        if (data.device_id && savedDevice && data.device_id !== savedDevice) {
            await signOut(auth);
            showMsg("loginMsg", "এই অ্যাকাউন্ট অন্য ডিভাইসে রেজিস্টার করা");
            if (btn) btn.disabled = false;
            return;
        }

        // Email Verification Check
        if (!user.emailVerified) {
            await signOut(auth);
            showMsg("loginMsg", "ইমেইল ভেরিফাই করুন। ইনবক্স চেক করুন।");
            if (btn) btn.disabled = false;
            return;
        }

        // Update verified flag
        if (!data.email_verified) {
            await updateDoc(userRef, { email_verified: true });
        }

        if (data.role === "admin") {
            window.location.href = "admin/dashboard.html";
        } else {
            window.location.href = "dashboard.html";
        }

    } catch (error) {
        console.error(error);
        showMsg("loginMsg", error.message || "লগইন ব্যর্থ");
        if (btn) btn.disabled = false;
    }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    const regBtn = document.getElementById("registerBtn");
    if (regBtn) regBtn.addEventListener("click", registerUser);

    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) loginBtn.addEventListener("click", loginUser);
});
