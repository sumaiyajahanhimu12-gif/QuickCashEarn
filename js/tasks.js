import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
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

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User Not Found");

            await signOut(auth);

            window.location.href =
                "login.html";

            return;

        }

        const userData =
            userSnap.data();

        // BAN PROTECTION

        if (
            userData.status ===
            "banned"
        ) {

            alert(
                "Your Account Has Been Suspended"
            );

            await signOut(auth);

            window.location.href =
                "login.html";

            return;

        }

        await loadTasks();

    } catch (error) {

        alert(error.message);

    }

});

async function loadTasks() {

    const user =
        auth.currentUser;

    const container =
        document.getElementById(
            "tasksContainer"
        );

    container.innerHTML = "";

    const snapshot =
        await getDocs(
            collection(
                db,
                "tasks"
            )
        );

    tasksData = [];

    const today =
        new Date()
        .toISOString()
        .split("T")[0];

    for (
        const taskDoc of snapshot.docs
    ) {

        const task =
            taskDoc.data();

        if (
            task.status !==
            "published"
        ) {

            continue;

        }

        const taskId =
            taskDoc.id;

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
                task.type ===
                "permanent"
            ) {

                continue;

            }

            if (
                task.type ===
                    "daily" &&
                claimData.last_claim_date ===
                    today
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

            <p>
                Reward:
                ${task.coin}
                Coins
            </p>

            <p>
                Type:
                ${task.type}
            </p>

            <button
            onclick="openTask('${taskId}','${task.link}')">

            Open Task

            </button>

            <div
            id="claim-${taskId}">

            </div>

        </div>

        <hr>

        `;

    }

    if (
        container.innerHTML ===
        ""
    ) {

        container.innerHTML =
            "<p>No Tasks Available</p>";

    }

}

window.openTask =
function (
    taskId,
    link
) {

    window.open(
        link,
        "_blank"
    );

    const task =
        tasksData.find(
            (t) =>
                t.id ===
                taskId
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
    ).innerHTML =
        html;

};

window.claimTask =
async function (
    taskId
) {

    try {

        const user =
            auth.currentUser;

        if (!user) {

            alert(
                "Login Required"
            );

            return;

        }

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const userSnap =
            await getDoc(
                userRef
            );

        if (
            !userSnap.exists()
        ) {

            alert(
                "User Not Found"
            );

            return;

        }

        const userData =
            userSnap.data();

        // BAN PROTECTION

        if (
            userData.status ===
            "banned"
        ) {

            alert(
                "Your Account Has Been Suspended"
            );

            await signOut(auth);

            window.location.href =
                "login.html";

            return;

        }

        const task =
            tasksData.find(
                (t) =>
                    t.id ===
                    taskId
            );

        if (!task) {

            alert(
                "Task Not Found"
            );

            return;

        }

        if (
            task.code &&
            task.code.trim() !==
                ""
        ) {

            const enteredCode =
                document
                    .getElementById(
                        `code-${taskId}`
                    )
                    .value
                    .trim();

            if (
                enteredCode !==
                task.code
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
                task.type ===
                "permanent"
            ) {

                alert(
                    "Already Claimed"
                );

                return;

            }

            if (
                task.type ===
                    "daily" &&
                claimData.last_claim_date ===
                    today
            ) {

                alert(
                    "Already Claimed Today"
                );

                return;

            }

        }

        await updateDoc(
            userRef,
            {

                coin:
                    increment(
                        task.coin
                    )

            }
        );

        // REFERRAL BONUS

        if (
            userData.referred_by &&
            userData.referred_by.trim() !==
                ""
        ) {

            const referralQuery =
                query(
                    collection(
                        db,
                        "users"
                    ),
                    where(
                        "referral_code",
                        "==",
                        userData.referred_by
                    )
                );

            const referralSnap =
                await getDocs(
                    referralQuery
                );

            if (
                !referralSnap.empty
            ) {

                const referrerDoc =
                    referralSnap.docs[0];

                if (
                    referrerDoc.id !==
                    user.uid
                ) {

                    const bonus =
                        Math.floor(
                            task.coin *
                                0.05
                        );

                    if (
                        bonus > 0
                    ) {

                        await updateDoc(
                            doc(
                                db,
                                "users",
                                referrerDoc.id
                            ),
                            {

                                coin:
                                    increment(
                                        bonus
                                    )

                            }
                        );

                        await addDoc(
                            collection(
                                db,
                                "referral_bonus_history"
                            ),
                            {

                                referrer_uid:
                                    referrerDoc.id,

                                referred_uid:
                                    user.uid,

                                referred_username:
                                    userData.username,

                                task_id:
                                    taskId,

                                task_coin:
                                    task.coin,

                                bonus_coin:
                                    bonus,

                                created_at:
                                    new Date()
                                        .toISOString()

                            }
                        );

                    }

                }

            }

        }

        const lastDate =
            userData.last_active_date ||
            "";

        if (
            lastDate !== today
        ) {

            let newActiveDays =
                1;

            if (
                lastDate
            ) {

                const last =
                    new Date(
                        lastDate
                    );

                const current =
                    new Date(
                        today
                    );

                const diffDays =
                    Math.floor(
                        (current -
                            last) /
                            (1000 *
                                60 *
                                60 *
                                24)
                    );

                if (
                    diffDays ===
                    1
                ) {

                    newActiveDays =
                        (
                            userData.active_days ||
                            0
                        ) + 1;

                }

            }

            await updateDoc(
                userRef,
                {

                    active_days:
                        newActiveDays,

                    last_active_date:
                        today

                }
            );

        }

        await setDoc(
            claimRef,
            {

                uid:
                    user.uid,

                task_id:
                    taskId,

                task_type:
                    task.type,

                last_claim_date:
                    today,

                claimed_at:
                    new Date()
                        .toISOString()

            }
        );

        alert(
            `${task.coin} Coins Added Successfully`
        );

        await loadTasks();

    } catch (error) {

        alert(
            error.message
        );

    }

};
