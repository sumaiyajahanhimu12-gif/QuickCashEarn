import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    const userDoc = await getDoc(
        doc(db, "users", user.uid)
    );

    if (!userDoc.exists()) {
        alert("User not found");
        return;
    }

    const data = userDoc.data();

    if (data.role !== "admin") {

        alert("Access Denied");

        window.location.href = "../dashboard.html";

        return;
    }

    loadStats();

});

async function loadStats() {

    const usersSnapshot =
        await getDocs(collection(db, "users"));

    let totalUsers = 0;
    let totalCoins = 0;

    usersSnapshot.forEach((doc) => {

        totalUsers++;

        totalCoins += doc.data().coin || 0;

    });

    document.getElementById(
        "totalUsers"
    ).innerText = totalUsers;

    document.getElementById(
        "totalCoins"
    ).innerText = totalCoins;

}

window.createTask = async function () {

    const name =
        document.getElementById("taskName").value;

    const link =
        document.getElementById("taskLink").value;

    const coin =
        parseInt(
            document.getElementById("taskCoin").value
        );

    const code =
        document.getElementById("taskCode").value;

    try {

        await addDoc(
            collection(db, "tasks"),
            {

                name: name,

                link: link,

                coin: coin,

                code: code,

                type: "permanent",

                status: "published",

                limit: 999999,

                completed_count: 0,

                created_at:
                    new Date().toISOString()

            }
        );

        alert("Task Created");

    } catch (error) {

        alert(error.message);

    }

};
