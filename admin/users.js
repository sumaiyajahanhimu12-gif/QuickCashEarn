import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "../login.html";

        return;

    }

    const adminSnap =
        await getDoc(
            doc(
                db,
                "users",
                user.uid
            )
        );

    if (!adminSnap.exists()) {

        alert("User Not Found");

        return;

    }

    if (
        adminSnap.data().role !==
        "admin"
    ) {

        alert("Access Denied");

        window.location.href =
            "../dashboard.html";

        return;

    }

    loadUsers();

});

window.loadUsers =
async function () {

    const container =
        document.getElementById(
            "usersContainer"
        );

    container.innerHTML = "";

    const keyword =
        document
        .getElementById(
            "searchUser"
        )
        .value
        .trim()
        .toLowerCase();

    const snapshot =
        await getDocs(
            collection(
                db,
                "users"
            )
        );

    snapshot.forEach(
        (userDoc) => {

            const data =
                userDoc.data();

            if (
                keyword &&
                !data.username
                    .toLowerCase()
                    .includes(keyword)
            ) {
                return;
            }

            container.innerHTML += `

            <div class="task-card">

                <h3>${data.username}</h3>

                <p>Email: ${data.email}</p>

                <p>Coin: ${data.coin || 0}</p>

                <p>Active Days: ${data.active_days || 0}</p>

                <p>Status: ${data.status || "active"}</p>

                <button
                onclick="addCoin('${userDoc.id}')">
                +1000 Coin
                </button>

                <button
                onclick="deductCoin('${userDoc.id}')">
                -1000 Coin
                </button>

                <button
                onclick="banUser('${userDoc.id}')">
                Ban
                </button>

                <button
                onclick="unbanUser('${userDoc.id}')">
                Unban
                </button>

            </div>

            <hr>

            `;

        });

};

window.addCoin =
async function(uid) {

    await updateDoc(
        doc(
            db,
            "users",
            uid
        ),
        {
            coin:
            increment(
                1000
            )
        }
    );

    alert(
        "1000 Coins Added"
    );

    loadUsers();

};

window.deductCoin =
async function(uid) {

    await updateDoc(
        doc(
            db,
            "users",
            uid
        ),
        {
            coin:
            increment(
                -1000
            )
        }
    );

    alert(
        "1000 Coins Deducted"
    );

    loadUsers();

};

window.banUser =
async function(uid) {

    await updateDoc(
        doc(
            db,
            "users",
            uid
        ),
        {
            status:
            "banned"
        }
    );

    alert(
        "User Banned"
    );

    loadUsers();

};

window.unbanUser =
async function(uid) {

    await updateDoc(
        doc(
            db,
            "users",
            uid
        ),
        {
            status:
            "active"
        }
    );

    alert(
        "User Unbanned"
    );

    loadUsers();

};
