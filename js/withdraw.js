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
    increment
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

        if (!auth.currentUser.emailVerified) {

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
            "Withdraw Request Submitted"
        );

        window.location.href =
            "dashboard.html";

    } catch (error) {

        alert(error.message);

    }

};
