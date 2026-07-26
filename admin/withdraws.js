import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    const userSnap =
        await getDoc(
            doc(db, "users", user.uid)
        );

    if (!userSnap.exists()) {

        alert("User Not Found");

        return;
    }

    if (userSnap.data().role !== "admin") {

        alert("Access Denied");

        window.location.href =
            "../dashboard.html";

        return;
    }

    loadWithdraws();

});

async function loadWithdraws() {

    const container =
        document.getElementById(
            "withdrawContainer"
        );

    container.innerHTML = "";

    const snapshot =
        await getDocs(
            collection(
                db,
                "withdraw_requests"
            )
        );

    if (snapshot.empty) {

        container.innerHTML =
            "<p>No Withdraw Requests</p>";

        return;
    }

    snapshot.forEach((requestDoc) => {

        const data =
            requestDoc.data();

        if (data.status !== "pending") {
            return;
        }

        container.innerHTML += `

        <div class="task-card">

            <h3>${data.username}</h3>

            <p>Method: ${data.method}</p>

            <p>Number: ${data.number}</p>

            <p>Coins: ${data.coin}</p>

            <button
            onclick="approveWithdraw('${requestDoc.id}')">
            Approve
            </button>

            <button
            onclick="rejectWithdraw('${requestDoc.id}')">
            Reject
            </button>

        </div>

        <hr>

        `;
    });

}

window.approveWithdraw =
async function(requestId) {

    try {

        await updateDoc(
            doc(
                db,
                "withdraw_requests",
                requestId
            ),
            {

                status: "approved",

                approved_at:
                    new Date()
                    .toISOString()

            }
        );

        alert(
            "Withdraw Approved"
        );

        location.reload();

    } catch (error) {

        alert(error.message);

    }

};

window.rejectWithdraw =
async function(requestId) {

    try {

        await updateDoc(
            doc(
                db,
                "withdraw_requests",
                requestId
            ),
            {

                status: "rejected"

            }
        );

        alert(
            "Withdraw Rejected"
        );

        location.reload();

    } catch (error) {

        alert(error.message);

    }

};
