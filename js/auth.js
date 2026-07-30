import { 
    auth, 
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    doc,
    setDoc,
    updateDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "./firebase.js";

// DEVICE ID GENERATOR (মোবাইল ও ব্রাউজার ফ্রেন্ডলি)
function getDeviceId() {
    let deviceId = localStorage.getItem("qce_device_id");
    if (!deviceId) {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            deviceId = crypto.randomUUID();
        } else {
            deviceId = "QCE-DEV-" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        }
        localStorage.setItem("qce_device_id", deviceId);
    }
    return deviceId;
}

window.registerUser = async function () {

    const usernameInput = document.getElementById("username");
    const telegramIdInput = document.getElementById("telegramId");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const referralCodeInput = document.getElementById("referralCode");

    const username = usernameInput ? usernameInput.value.trim() : "";
    const telegramId = telegramIdInput ? telegramIdInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const referralCode = referralCodeInput ? referralCodeInput.value.trim() : "";

    if (!username || !telegramId || !email || !password) {
        alert("Please fill all required fields");
        return;
    }

    try {

        // DEVICE ID
        const deviceId = getDeviceId();
        const usersRef = collection(db, "users");

        // ONE DEVICE = ONE ACCOUNT
        const deviceSnap = await getDocs(
            query(usersRef, where("device_id", "==", deviceId))
        );

        if (!deviceSnap.empty) {
            alert("Only One Account Allowed Per Device");
            return;
        }

        // USERNAME CHECK
        const usernameSnap = await getDocs(
            query(usersRef, where("username", "==", username))
        );

        if (!usernameSnap.empty) {
            alert("Username Already Exists");
            return;
        }

        // TELEGRAM CHECK
        const telegramSnap = await getDocs(
            query(usersRef, where("telegram_id", "==", telegramId))
        );

        if (!telegramSnap.empty) {
            alert("Telegram ID Already Registered");
            return;
        }

        // REFERRAL CHECK (Optional)
        let validReferralCode = "";
        if (referralCode) {
            const referralSnap = await getDocs(
                query(usersRef, where("referral_code", "==", referralCode))
            );

            if (!referralSnap.empty) {
                validReferralCode = referralCode;
            }
        }

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;

        await sendEmailVerification(user);

        const generatedReferralCode =
            "QCE-" +
            username.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 4) +
            "-" +
            Math.floor(1000 + Math.random() * 9000);

        await setDoc(
            doc(db, "users", user.uid),
            {
                username: username,
                telegram_id: telegramId,
                device_id: deviceId,
                email: email,
                coin: 0,
                referral_code: generatedReferralCode,
                referred_by: validReferralCode,
                active_days: 0,
                last_active_date: "",
                email_verified: false,
                telegram_verified: false,
                role: "user",
                status: "active",
                ban_reason: "",
                created_at: new Date().toISOString()
            }
        );

        alert("Registration Successful.\n\nVerification Email Sent.");
        window.location.href = "login.html";

    } catch (error) {
        console.log(error);
        alert(
            "REGISTER ERROR\n\n" +
            (error.code || "") +
            "\n\n" +
            error.message
        );
    }
};

window.loginUser = async function () {

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {
        alert("Please enter both Email and Password");
        return;
    }

    try {

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await signOut(auth);
            alert("User Data Not Found");
            return;
        }

        const userData = userSnap.data();

        // DEVICE CHECK
        const savedDeviceId = localStorage.getItem("qce_device_id");

        if (
            userData.device_id &&
            savedDeviceId &&
            userData.device_id !== savedDeviceId
        ) {
            await signOut(auth);
            alert("This Account Is Registered On Another Device");
            return;
        }

        // BAN CHECK
        if (userData.status === "banned") {
            await signOut(auth);
            alert(
                "Your Account Has Been Suspended\n\nReason:\n" +
                (userData.ban_reason || "Policy Violation")
            );
            return;
        }

        await user.reload();

        if (user.emailVerified) {
            await updateDoc(userRef, {
                email_verified: true
            });
        }

        alert("Login Successful");

        if (userData.role === "admin") {
            window.location.href = "admin/dashboard.html";
        } else {
            window.location.href = "dashboard.html";
        }

    } catch (error) {
        console.log(error);
        alert(
            "LOGIN ERROR\n\n" +
            (error.code || "") +
            "\n\n" +
            error.message
        );
    }
};
