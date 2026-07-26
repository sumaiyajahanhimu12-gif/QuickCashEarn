import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let tasksData = [];

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

    tasksData = [];

    snapshot.forEach((taskDoc) => {

        const task = taskDoc.data();

        if (task.status !== "published") {
            return;
        }

        const taskId = taskDoc.id;

        tasksData.push({
            id: taskId,
            ...task
        });

        container.innerHTML += `

        <div class="task-card" id="task-${taskId}">

            <h3>${task.name}</h3>

            <p>
                Reward:
                ${task.coin} Coins
            </p>

            <button
            onclick="openTask('${taskId}','${task.link}')">
            Open Task
            </button>

            <div id="claim-${taskId}"></div>

        </div>

        <hr>

        `;

    });

}

window.openTask = function(taskId, link) {

    window.open(link, "_blank");

    const task =
        tasksData.find(
            t => t.id === taskId
        );

    let html = "";

    if (task.code && task.code.trim() !== "") {

        html += `

        <br>

        <input
        type="text"
        id="code-${taskId}"
        placeholder="Enter Verification Code">

        <br><br>

        `;

    }

    html += `

    <button
    onclick="claimTask('${taskId}')">
    Claim Reward
    </button>

    `;

    document.getElementById(
        `claim-${taskId}`
    ).innerHTML = html;

};

window.claimTask = function(taskId) {

    alert(
        "Claim System will be connected in next step."
    );

};
