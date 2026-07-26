import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    loadReferrals(user.uid);

});

async function loadReferrals(uid) {

    const userSnap =
        await getDoc(
            doc(db, "users", uid)
        );

    if (!userSnap.exists()) return;

    const userData =
        userSnap.data();

    const myCode =
        userData.referral_code;

    document.getElementById(
        "myCode"
    ).innerText = myCode;

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

    let totalReferrals = 0;
    let validReferrals = 0;

    let referralCoins = [];

    let html = "";

    referralsSnap.forEach((docSnap) => {

        totalReferrals++;

        const data =
            docSnap.data();

        const coin =
            data.coin || 0;

        if (coin > 0) {

            validReferrals++;

        }

        referralCoins.push(coin);

        html += `

        <div class="task-card">

            <h3>${data.username}</h3>

            <p>
                Coins:
                ${coin}
            </p>

            <p>
                Active Days:
                ${data.active_days || 0}
            </p>

        </div>

        <hr>

        `;

    });

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

    document.getElementById(
        "totalReferrals"
    ).innerText =
        totalReferrals;

    document.getElementById(
        "validReferrals"
    ).innerText =
        validReferrals;

    document.getElementById(
        "top10Coins"
    ).innerText =
        top10Coins;

    document.getElementById(
        "referralList"
    ).innerHTML =
        html || "No Referrals Yet";

              }
