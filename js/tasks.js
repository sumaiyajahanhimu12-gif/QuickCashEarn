import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    loadTasks();

});

async function loadTasks() {

    const container =
        document.getElementById("tasksContainer");

    container.innerHTML = "";

    const snapshot =
        await getDocs(
            collection(db, "tasks")
        );

    snapshot.forEach((taskDoc) => {

        const task = taskDoc.data();

        if (task.status !== "published") {
            return;
        }

        container.innerHTML += `

        <div class="task-card">

            <h3>${task.name}</h3>

            <p>
                Reward:
                ${task.coin} Coins
            </p>

            <button
            onclick="window.open('${task.link}','_blank')">
            Open Task
            </button>

        </div>

        <hr>

        `;

    });

}
