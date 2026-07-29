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

let currentAdminId = "";

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";
        return;

    }

    try {

        currentAdminId = user.uid;

        const adminSnap =
            await getDoc(
                doc(db, "users", user.uid)
            );

        if (!adminSnap.exists()) {

            alert("User Not Found");
            return;

        }

        const adminData =
            adminSnap.data();

        if (
            adminData.status === "banned"
        ) {

            alert(
                "Your Account Has Been Suspended"
            );

            window.location.href =
                "../login.html";

            return;

        }

        if (
            adminData.role !== "admin"
        ) {

            alert("Access Denied");

            window.location.href =
                "../dashboard.html";

            return;

        }

        loadUsers();

    } catch (error) {

        alert(error.message);

    }

});

window.loadUsers = async function () {

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
            collection(db, "users")
        );

    snapshot.forEach((userDoc) => {

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

            <p>Role: ${data.role || "user"}</p>

            <button onclick="addCoin('${userDoc.id}')">
                +1000 Coin
            </button>

            <button onclick="deductCoin('${userDoc.id}')">
                -1000 Coin
            </button>

            <button onclick="banUser('${userDoc.id}')">
                Ban
            </button>

            <button onclick="unbanUser('${userDoc.id}')">
                Unban
            </button>

        </div>

        <hr>

        `;

    });

};

window.addCoin = async function(uid) {

    try {

        await updateDoc(
            doc(db, "users", uid),
            {
                coin: increment(1000)
            }
        );

        alert("1000 Coins Added");

        loadUsers();

    } catch (error) {

        alert(error.message);

    }

};

window.deductCoin = async function(uid) {

    try {

        await updateDoc(
            doc(db, "users", uid),
            {
                coin: increment(-1000)
            }
        );

        alert("1000 Coins Deducted");

        loadUsers();

    } catch (error) {

        alert(error.message);

    }

};

window.banUser = async function(uid) {

    try {

        if (uid === currentAdminId) {

            alert(
                "You Cannot Ban Yourself"
            );

            return;

        }

        const reason =
            prompt(
                "Enter Ban Reason"
            );

        if (!reason) return;

        await updateDoc(
            doc(db, "users", uid),
            {
                status: "banned",
                ban_reason: reason
            }
        );

        alert("User Banned");

        loadUsers();

    } catch (error) {

        alert(error.message);

    }

};

window.unbanUser = async function(uid) {

    try {

        await updateDoc(
            doc(db, "users", uid),
            {
                status: "active",
                ban_reason: ""
            }
        );

        alert("User Unbanned");

        loadUsers();

    } catch (error) {

        alert(error.message);

    }

};
