import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
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

    loadHistory(user.uid);

});

async function loadHistory(uid) {

    const container =
        document.getElementById(
            "historyContainer"
        );

    container.innerHTML = "";

    const historyQuery =
        query(
            collection(
                db,
                "withdraw_requests"
            ),
            where(
                "uid",
                "==",
                uid
            )
        );

    const historySnap =
        await getDocs(
            historyQuery
        );

    if (historySnap.empty) {

        container.innerHTML =
            "<p>No Withdraw History Found</p>";

        return;

    }

    historySnap.forEach((docSnap) => {

        const data =
            docSnap.data();

        let statusText = "";

        if (
            data.status === "approved"
        ) {

            statusText =
                "✅ Approved";

        } else if (
            data.status === "rejected"
        ) {

            statusText =
                "❌ Rejected";

        } else {

            statusText =
                "⏳ Pending";

        }

        container.innerHTML += `

        <div class="task-card">

            <h3>${data.coin} Coins</h3>

            <p>
                Method:
                ${data.method}
            </p>

            <p>
                Number:
                ${data.number}
            </p>

            <p>
                Status:
                ${statusText}
            </p>

            <p>
                Date:
                ${data.created_at}
            </p>

        </div>

        <hr>

        `;

    });

      }
