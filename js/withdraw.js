import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    addDoc,
    collection,
    updateDoc,
    increment,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUserData = null;

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

            alert("User not found");
            return;

        }

        currentUserData =
            userSnap.data();

        // BAN PROTECTION

        if (
            currentUserData.status === "banned"
        ) {

            alert(
                "Your Account Has Been Suspended"
            );

            window.location.href =
                "dashboard.html";

            return;

        }

        document.getElementById(
            "coinBalance"
        ).innerText =
            currentUserData.coin || 0;

    } catch (error) {

        alert(error.message);

    }

});

window.submitWithdraw = async function () {

    try {

        const user =
            auth.currentUser;

        if (!user) {

            alert("Login Required");
            return;

        }

        // LIVE USER CHECK

        const latestUserRef =
            doc(
                db,
                "users",
                user.uid
            );

        const latestUserSnap =
            await getDoc(
                latestUserRef
            );

        if (
            !latestUserSnap.exists()
        ) {

            alert(
                "User Not Found"
            );

            return;

        }

        const latestUserData =
            latestUserSnap.data();

        // BAN PROTECTION

        if (
            latestUserData.status === "banned"
        ) {

            alert(
                "Your Account Has Been Suspended"
            );

            return;

        }

        // PENDING REQUEST CHECK

        const pendingQuery =
            query(
                collection(
                    db,
                    "withdraw_requests"
                ),
                where(
                    "uid",
                    "==",
                    user.uid
                ),
                where(
                    "status",
                    "==",
                    "pending"
                )
            );

        const pendingSnap =
            await getDocs(
                pendingQuery
            );

        if (!pendingSnap.empty) {

            alert(
                "You already have a pending withdraw request"
            );

            return;

        }

        const method =
            document.getElementById(
                "method"
            ).value;

        const number =
            document.getElementById(
                "number"
            ).value.trim();

        const amount =
            parseInt(
                document.getElementById(
                    "amount"
                ).value
            );

        if (!number) {

            alert(
                "Enter Payment Number"
            );

            return;

        }

        if (
            !amount ||
            amount < 50000
        ) {

            alert(
                "Minimum Withdraw 50000 Coins"
            );

            return;

        }

        if (
            latestUserData.coin < amount
        ) {

            alert(
                "Insufficient Coin Balance"
            );

            return;

        }

        if (
            !user.emailVerified
        ) {

            alert(
                "Verify Email First"
            );

            return;

        }

        if (
            (latestUserData.active_days || 0) < 14
        ) {

            alert(
                "14 Active Days Required"
            );

            return;

        }

        // REFERRAL CODE CHECK

        if (
            !latestUserData.referral_code
        ) {

            alert(
                "Referral Code Missing"
            );

            return;

        }

        // REFERRAL VALIDATION

        const myCode =
            latestUserData.referral_code;

        const referralsQuery =
            query(
                collection(
                    db,
                    "users"
                ),
                where(
                    "referred_by",
                    "==",
                    myCode
                )
            );

        const referralsSnap =
            await getDocs(
                referralsQuery
            );

        const totalReferrals =
            referralsSnap.size;

        if (
            totalReferrals < 10
        ) {

            alert(
                "Minimum 10 Referrals Required"
            );

            return;

        }

        let referralCoins = [];

        referralsSnap.forEach(
            (docSnap) => {

                const data =
                    docSnap.data();

                referralCoins.push(
                    data.coin || 0
                );

            }
        );

        referralCoins.sort(
            (a, b) => b - a
        );

        const top10Coins =
            referralCoins
            .slice(0, 10)
            .reduce(
                (sum, coin) =>
                    sum + coin,
                0
            );

        if (
            top10Coins < 100000
        ) {

            alert(
                "Top 10 Referral Coins must be at least 100000"
            );

            return;

        }

        // DATE VALIDATION

        const today =
            new Date();

        const day =
            today.getDate();

        if (
            day < 1 ||
            day > 10
        ) {

            alert(
                "Withdraw Allowed Only Between 1-10 Date"
            );

            return;

        }

        // CREATE WITHDRAW REQUEST

        await addDoc(
            collection(
                db,
                "withdraw_requests"
            ),
            {

                uid: user.uid,

                username:
                    latestUserData.username,

                method: method,

                number: number,

                coin: amount,

                status: "pending",

                created_at:
                    new Date()
                    .toISOString(),

                approved_at: "",

                approved_by: ""

            }
        );

        // WITHDRAW HISTORY

        await addDoc(
            collection(
                db,
                "withdraw_history"
            ),
            {

                uid: user.uid,

                username:
                    latestUserData.username,

                method: method,

                number: number,

                coin: amount,

                status: "pending",

                created_at:
                    new Date()
                    .toISOString()

            }
        );

        // DEDUCT COINS

        await updateDoc(
            latestUserRef,
            {

                coin:
                increment(
                    -amount
                )

            }
        );

        alert(
            "Withdraw Request Submitted Successfully"
        );

        window.location.href =
            "dashboard.html";

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

};
