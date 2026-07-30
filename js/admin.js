import {
    auth,
    db,
    onAuthStateChanged,
    doc,
    getDoc,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc
} from "./firebase.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists() || userDoc.data().status === "banned") {
            window.location.href = "../login.html";
            return;
        }
        if (userDoc.data().role !== "admin") {
            alert("Access Denied");
            window.location.href = "../dashboard.html";
            return;
        }
        await loadStats();
        await loadTasks();
    } catch (e) {
        alert(e.message);
    }
});

async function loadStats() {
    try {
        const snap = await getDocs(collection(db, "users"));
        let totalUsers = 0, totalCoins = 0;
        snap.forEach(d => {
            totalUsers++;
            totalCoins += d.data().coin || 0;
        });
        document.getElementById("totalUsers").innerText = totalUsers;
        document.getElementById("totalCoins").innerText = totalCoins;
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("createTaskBtn");
    if (btn) btn.addEventListener("click", createTask);
});

async function createTask() {
    const name = document.getElementById("taskName")?.value.trim() || "";
    const link = document.getElementById("taskLink")?.value.trim() || "";
    const coin = parseInt(document.getElementById("taskCoin")?.value) || 0;
    const limitVal = document.getElementById("taskLimit")?.value || "";
    const code = document.getElementById("taskCode")?.value.trim() || "";
    const type = document.getElementById("taskType")?.value || "daily";
    const status = document.getElementById("taskStatus")?.value || "published";

    if (!name || !link || !coin) return alert("Required fields missing");

    try {
        await addDoc(collection(db, "tasks"), {
            name, link, coin,
            limit: limitVal ? parseInt(limitVal) : null,
            code: code || "",
            type, status,
            completed_count: 0,
            created_at: new Date().toISOString()
        });
        alert("Task Created");
        document.getElementById("taskName").value = "";
        document.getElementById("taskLink").value = "";
        document.getElementById("taskCoin").value = "";
        document.getElementById("taskLimit").value = "";
        document.getElementById("taskCode").value = "";
        await loadTasks();
    } catch (e) {
        alert(e.message);
    }
}

async function loadTasks() {
    const container = document.getElementById("tasksContainer");
    if (!container) return;
    container.innerHTML = "";
    try {
        const snap = await getDocs(collection(db, "tasks"));
        if (snap.empty) {
            container.innerHTML = "<p>No Tasks Found</p>";
            return;
        }
        snap.forEach(d => {
            const t = d.data();
            container.innerHTML += `
                <div class="task-card">
                    <h3>${t.name}</h3>
                    <p>Coins: ${t.coin} | Type: ${t.type} | Status: ${t.status}</p>
                    <p>Completed: ${t.completed_count || 0}</p>
                    <button onclick="deleteTask('${d.id}')">Delete</button>
                    <button onclick="pauseTask('${d.id}')">Pause</button>
                    <button onclick="publishTask('${d.id}')">Publish</button>
                </div>
                <hr>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

window.deleteTask = async function (id) {
    if (!confirm("Delete this task?")) return;
    try {
        await deleteDoc(doc(db, "tasks", id));
        alert("Deleted");
        await loadTasks();
    } catch (e) {
        alert(e.message);
    }
};

window.pauseTask = async function (id) {
    try {
        await updateDoc(doc(db, "tasks", id), { status: "pending" });
        alert("Paused");
        await loadTasks();
    } catch (e) {
        alert(e.message);
    }
};

window.publishTask = async function (id) {
    try {
        await updateDoc(doc(db, "tasks", id), { status: "published" });
        alert("Published");
        await loadTasks();
    } catch (e) {
        alert(e.message);
    }
};
