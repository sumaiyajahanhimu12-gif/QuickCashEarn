import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    setDoc,
    updateDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.registerUser = async function () {

    const username =
        document.getElementById("username").value.trim();

    const telegramId =
        document.getElementById("telegramId").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const referralCode =
        document.getElementById("referralCode").value.trim();

    if (
        !username ||
        !telegramId ||
        !email ||
        !password
    ) {

        alert("Please fill all required fields");
        return;

    }

    try {

        // DEVICE ID

        let deviceId =
            localStorage.getItem(
                "qce_device_id"
            );

        if (!deviceId) {

            deviceId =
                crypto.randomUUID();

            localStorage.setItem(
                "qce_device_id",
                deviceId
            );

        }

        const usersRef =
            collection(db, "users");

        // ONE DEVICE = ONE ACCOUNT

        const deviceSnap =
            await getDocs(
                query(
                    usersRef,
                    where(
                        "device_id",
                        "==",
                        deviceId
                    )
                )
            );

        if (!deviceSnap.empty) {

            alert(
                "Only One Account Allowed Per Device"
            );

            return;

        }

        // USERNAME CHECK

        const usernameSnap =
            await getDocs(
                query(
                    usersRef,
                    where(
                        "username",
                        "==",
                        username
                    )
                )
            );

        if (!usernameSnap.empty) {

            alert(
                "Username Already Exists"
            );

            return;

        }

        // TELEGRAM CHECK

        const telegramSnap =
            await getDocs(
                query(
                    usersRef,
                    where(
                        "telegram_id",
                        "==",
                        telegramId
                    )
                )
            );

        if (!telegramSnap.empty) {

            alert(
                "Telegram ID Already Registered"
            );

            return;

        }

        // REFERRAL CHECK

        if (referralCode) {

            const referralSnap =
                await getDocs(
                    query(
                        usersRef,
                        where(
                            "referral_code",
                            "==",
                            referralCode
                        )
                    )
                );

            if (referralSnap.empty) {

                alert(
                    "Invalid Referral Code"
                );

                return;

            }

        }

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            userCredential.user;

        await sendEmailVerification(user);

        const generatedReferralCode =
            "QCE-" +
            username
                .toUpperCase()
                .substring(0, 4) +
            "-" +
            Math.floor(
                1000 +
                Math.random() * 9000
            );

        await setDoc(
            doc(
                db,
                "users",
                user.uid
            ),
            {

                username:
                    username,

                telegram_id:
                    telegramId,

                device_id:
                    deviceId,

                email:
                    email,

                coin: 0,

                referral_code:
                    generatedReferralCode,

                referred_by:
                    referralCode || "",

                active_days: 0,

                last_active_date: "",

                email_verified: false,

                telegram_verified: false,

                role: "user",

                status: "active",

                ban_reason: "",

                created_at:
                    new Date()
                    .toISOString()

            }
        );

        alert(
            "Registration Successful.\n\nVerification Email Sent."
        );

        window.location.href =
            "login.html";

    } catch (error) {

        console.log(error);

        alert(
            "REGISTER ERROR\n\n" +
            error.code +
            "\n\n" +
            error.message
        );

    }

};

window.loginUser = async function () {

    const email =
        document
        .getElementById(
            "loginEmail"
        )
        .value
        .trim();

    const password =
        document
        .getElementById(
            "loginPassword"
        )
        .value;

    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            userCredential.user;

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const userSnap =
            await getDoc(
                userRef
            );

        if (!userSnap.exists()) {

            await signOut(auth);

            alert(
                "User Data Not Found"
            );

            return;

        }

        const userData =
            userSnap.data();

        // DEVICE CHECK

        const savedDeviceId =
            localStorage.getItem(
                "qce_device_id"
            );

        if (
            userData.device_id &&
            savedDeviceId &&
            userData.device_id !== savedDeviceId
        ) {

            await signOut(auth);

            alert(
                "This Account Is Registered On Another Device"
            );

            return;

        }

        // BAN CHECK

        if (
            userData.status ===
            "banned"
        ) {

            await signOut(auth);

            alert(
                "Your Account Has Been Suspended\n\nReason:\n" +
                (
                    userData.ban_reason ||
                    "Policy Violation"
                )
            );

            return;

        }

        await user.reload();

        if (
            user.emailVerified
        ) {

            await updateDoc(
                userRef,
                {
                    email_verified:
                        true
                }
            );

        }

        alert(
            "Login Successful"
        );

        window.location.href =
            "dashboard.html";

    } catch (error) {

        console.log(error);

        alert(
            "LOGIN ERROR\n\n" +
            error.code +
            "\n\n" +
            error.message
        );

    }

};
