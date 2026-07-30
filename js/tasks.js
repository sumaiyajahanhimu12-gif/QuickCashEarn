import {
    auth,
    db,
    onAuthStateChanged,
    signOut,
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
} from "./firebase.js";

let tasksData = [];

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    try {
        await user.reload();
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists() || userSnap.data().status === "banned") {
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }
        if (!user.emailVerified) {
            await signOut(auth);
            alert("ইমেইল ভেরিফাই করুন");
            window.location.href = "login.html";
            return;
        }
        await loadTasks();
    } catch (e) {
        alert(e.message);
    }
});

async function loadTasks() {
    const user = auth.currentUser;
    const container = document.getElementById("tasksContainer");
    if (!container) return;
    container.innerHTML = "";
    tasksData = [];

    const snapshot = await getDocs(collection(db, "tasks"));
    const today = new Date().toISOString().split("T")[0];

    for (const taskDoc of snapshot.docs) {
        const task = taskDoc.data();
        if (task.status !== "published") continue;
        if (task.limit && (task.completed_count || 0) >= task.limit) continue;

        const taskId = taskDoc.id;
        const claimId = user.uid + "_" + taskId;
        const claimSnap = await getDoc(doc(db, "task_claims", claimId));

        if (claimSnap.exists()) {
            const claim = claimSnap.data();
            if (task.type === "permanent") continue;
            if (task.type === "daily" && claim.last_claim_date === today) continue;
        }

        tasksData.push({ id: taskId, ...task });

        container.innerHTML += `
            <div class="task-card">
                <h3>${task.name}</h3>
                <p>Reward: ${task.coin} Coins</p>
                <p>Type: ${task.type}</p>
                <button class="open-task-btn" data-id="${taskId}">Open Task</button>
                <div id="claim-${taskId}"></div>
            </div>
            <hr>
        `;
    }

    if (!container.innerHTML) {
        container.innerHTML = "<p>No Tasks Available</p>";
        return;
    }

    document.querySelectorAll(".open-task-btn").forEach(btn => {
        btn.onclick = function () {
            const id = this.getAttribute("data-id");
            const task = tasksData.find(t => t.id === id);
            openTask(id, task ? task.link : "");
        };
    });
}

window.openTask = function (taskId, link) {
    if (link && link.trim() !== "") {
        window.open(link, "_blank");
    } else {
        alert("Task link not found");
    }

    const task = tasksData.find(t => t.id === taskId);
    let html = "";
    if (task && task.code && task.code.trim() !== "") {
        html += `<br><input type="text" id="code-${taskId}" placeholder="Verification Code"><br><br>`;
    }
    html += `<button onclick="claimTask('${taskId}')">Claim Reward</button>`;

    const div = document.getElementById("claim-" + taskId);
    if (div) div.innerHTML = html;
};

window.claimTask = async function (taskId) {
    try {
        const user = auth.currentUser;
        if (!user) return alert("Login Required");

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return alert("User Not Found");
        const userData = userSnap.data();
        if (userData.status === "banned") {
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }

        const task = tasksData.find(t => t.id === taskId);
        if (!task) return alert("Task Not Found");
        if (task.limit && (task.completed_count || 0) >= task.limit) return alert("Task Limit Reached");

        if (task.code && task.code.trim() !== "") {
            const entered = document.getElementById("code-" + taskId)?.value.trim() || "";
            if (entered !== task.code) return alert("Wrong Verification Code");
        }

        const today = new Date().toISOString().split("T")[0];
        const claimId = user.uid + "_" + taskId;
        const claimRef = doc(db, "task_claims", claimId);
        const claimSnap = await getDoc(claimRef);

        if (claimSnap.exists()) {
            const claim = claimSnap.data();
            if (task.type === "permanent") return alert("Already Claimed");
            if (task.type === "daily" && claim.last_claim_date === today) return alert("Already Claimed Today");
        }

        await updateDoc(userRef, { coin: increment(task.coin) });
        await updateDoc(doc(db, "tasks", taskId), { completed_count: increment(1) });

        if (userData.referred_by && userData.referred_by.trim() !== "") {
            const refQ = query(collection(db, "users"), where("referral_code", "==", userData.referred_by));
            const refSnap = await getDocs(refQ);
            if (!refSnap.empty) {
                const referrer = refSnap.docs[0];
                if (referrer.id !== user.uid) {
                    const bonus = Math.floor(task.coin * 0.05);
                    if (bonus > 0) {
                        await updateDoc(doc(db, "users", referrer.id), { coin: increment(bonus) });
                        await addDoc(collection(db, "referral_bonus_history"), {
                            referrer_uid: referrer.id,
                            referred_uid: user.uid,
                            referred_username: userData.username || "",
                            task_id: taskId,
                            task_coin: task.coin,
                            bonus_coin: bonus,
                            created_at: new Date().toISOString()
                        });
                    }
                }
            }
        }

        const lastDate = userData.last_active_date || "";
        if (lastDate !== today) {
            let newDays = 1;
            if (lastDate) {
                const diff = Math.floor((new Date(today) - new Date(lastDate)) / 86400000);
                if (diff === 1) newDays = (userData.active_days || 0) + 1;
            }
            await updateDoc(userRef, { active_days: newDays, last_active_date: today });
        }

        await setDoc(claimRef, {
            uid: user.uid,
            task_id: taskId,
            task_type: task.type,
            last_claim_date: today,
            claimed_at: new Date().toISOString()
        });

        alert(task.coin + " Coins Added");
        await loadTasks();
    } catch (e) {
        alert(e.message);
    }
};
