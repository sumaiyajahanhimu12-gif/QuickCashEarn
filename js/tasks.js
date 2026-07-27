import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    addDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let tasksData = [];

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    await loadTasks();

});

async function loadTasks() {

    const user = auth.currentUser;

    const container =
        document.getElementById("tasksContainer");

    container.innerHTML = "";

    const snapshot =
        await getDocs(
            collection(db, "tasks")
        );

    tasksData = [];

    const today =
        new Date()
        .toISOString()
        .split("T")[0];

    for (const taskDoc of snapshot.docs) {

        const task = taskDoc.data();

        if (task.status !== "published") {
            continue;
        }

        const taskId = taskDoc.id;

        const claimId =
            `${user.uid}_${taskId}`;

        const claimRef =
            doc(
                db,
                "task_claims",
                claimId
            );

        const claimSnap =
            await getDoc(claimRef);

        if (claimSnap.exists()) {

            const claimData =
                claimSnap.data();

            if (
                task.type === "permanent"
            ) {
                continue;
            }

            if (
                task.type === "daily" &&
                claimData.last_claim_date === today
            ) {
                continue;
            }

        }

        tasksData.push({
            id: taskId,
            ...task
        });

        container.innerHTML += `

        <div class="task-card">

            <h3>${task.name}</h3>

            <p>Reward: ${task.coin} Coins</p>

            <p>Type: ${task.type}</p>

            <button
            onclick="openTask('${taskId}','${task.link}')">
            Open Task
            </button>

            <div id="claim-${taskId}"></div>

        </div>

        <hr>

        `;
    }

    if (container.innerHTML === "") {

        container.innerHTML =
            "<p>No Tasks Available</p>";

    }

}

window.openTask = function(taskId, link) {

    window.open(link, "_blank");

    const task =
        tasksData.find(
            t => t.id === taskId
        );

    let html = "";

    if (
        task.code &&
        task.code.trim() !== ""
    ) {

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

window.claimTask = async function(taskId) {

    try {

        const user =
            auth.currentUser;

        if (!user) {

            alert("Login Required");
            return;

        }

        const task =
            tasksData.find(
                t => t.id === taskId
            );

        if (!task) {

            alert("Task Not Found");
            return;

        }

        if (
            task.code &&
            task.code.trim() !== ""
        ) {

            const enteredCode =
                document
                .getElementById(
                    `code-${taskId}`
                )
                .value
                .trim();

            if (
                enteredCode !== task.code
            ) {

                alert(
                    "Wrong Verification Code"
                );

                return;

            }

        }

        const today =
            new Date()
            .toISOString()
            .split("T")[0];

        const claimId =
            `${user.uid}_${taskId}`;

        const claimRef =
            doc(
                db,
                "task_claims",
                claimId
            );

        const claimSnap =
            await getDoc(
                claimRef
            );

        if (
            claimSnap.exists()
        ) {

            const claimData =
                claimSnap.data();

            if (
                task.type === "permanent"
            ) {

                alert(
                    "Already Claimed"
                );

                return;

            }

            if (
                task.type === "daily" &&
                claimData.last_claim_date === today
            ) {

                alert(
                    "Already Claimed Today"
                );

                return;

            }

        }

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const userSnap =
            await getDoc(userRef);

        const userData =
            userSnap.data();

        // User Coin Add

        await updateDoc(
            userRef,
            {
                coin:
                increment(
                    task.coin
                )
            }
        );

        // Referral Bonus

        if (
            userData.referred_by &&
            userData.referred_by.trim() !== ""
        ) {

            const referralQuery =
                query(
                    collection(db, "users"),
                    where(
                        "ref
