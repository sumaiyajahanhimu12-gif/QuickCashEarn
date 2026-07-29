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
                "Username already exists"
            );

            return;

        }

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
                "Telegram ID already registered"
            );

            return;

        }

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
            "Registration Successful.\n\nVerification email sent."
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
            await getDoc(userRef);

        if (!userSnap.exists()) {

            await signOut(auth);

            alert(
                "User data not found"
            );

            return;

        }

        const userData =
            userSnap.data();

        if (
            userData.status ===
            "banned"
        ) {

            await signOut(auth);

            alert(
                "Your account has been suspended.\n\nReason:\n" +
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
