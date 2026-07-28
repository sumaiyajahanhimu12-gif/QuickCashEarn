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

    document.getElementById(
        "coinBalance"
    ).innerText =
        currentUserData.coin || 0;

});

window.submitWithdraw = async function () {

    try {

        const user =
            auth.currentUser;

        if (!user) {

            alert("Login Required");

            return;

        }

        // Pending Withdraw Check

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

        if (!amount || amount < 50000) {

            alert(
                "Minimum Withdraw 50000 Coins"
            );

            return;

        }

        if (
            currentUserData.coin < amount
        ) {

            alert(
                "Insufficient Coin Balance"
            );

            return;

        }

        if (!user.emailVerified) {

            alert(
                "Verify Email First"
            );

            return;

        }

        if (
            (currentUserData.active_days || 0)
            < 14
        ) {

            alert(
                "14 Active Days Required"
            );

            return;

        }

        // Referral Validation

        const myCode =
            currentUserData.referral_code;

        const referralsQuery =
            query(
                collection(db, "users"),
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

        // Date Check

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

        // Create Withdraw Request

        await addDoc(
            collection(
                db,
                "withdraw_requests"
            ),
            {

                uid: user.uid,

                username:
                    currentUserData.username,

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

        // Deduct Coins

        await updateDoc(
            doc(
                db,
                "users",
                user.uid
            ),
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

        alert(error.message);

    }

};
