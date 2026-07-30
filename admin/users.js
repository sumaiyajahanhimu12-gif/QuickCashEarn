import {
    auth,
    db,
    onAuthStateChanged,
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    increment
} from "../js/firebase.js";

let currentAdminId = "";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }
    try {
        currentAdminId = user.uid;
        const adminSnap = await getDoc(doc(db, "users", user.uid));
        if (!adminSnap.exists() || adminSnap.data().status === "banned") {
            window.location.href = "../login.html";
            return;
        }
        if (adminSnap.data().role !== "admin") {
            alert("Access Denied");
            window.location.href = "../dashboard.html";
            return;
        }
        await loadUsers();
    } catch (e) {
        alert(e.message);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("searchBtn");
    if (btn) btn.addEventListener("click", loadUsers);
});

async function loadUsers() {
    const container = document.getElementById("usersContainer");
    if (!container) return;
    container.innerHTML = "";
    const keyword = (document.getElementById("searchUser")?.value || "").trim().toLowerCase();

    try {
        const snap = await getDocs(collection(db, "users"));
        snap.forEach(userDoc => {
            const data = userDoc.data();
            const username = data.username || "";
            if (keyword && !username.toLowerCase().includes(keyword)) return;

            container.innerHTML += `
                <div class="task-card">
                    <h3>${username || "No Username"}</h3>
                    <p>Email: ${data.email || "N/A"}</p>
                    <p>Coin: ${data.coin || 0}</p>
                    <p>Active Days: ${data.active_days || 0}</p>
                    <p>Status: ${data.status || "active"}</p>
                    <p>Role: ${data.role || "user"}</p>
                    <button onclick="addCoin('${userDoc.id}')">+1000 Coin</button>
                    <button onclick="deductCoin('${userDoc.id}')">-1000 Coin</button>
                    <button onclick="banUser('${userDoc.id}')">Ban</button>
                    <button onclick="unbanUser('${userDoc.id}')">Unban</button>
                </div>
                <hr>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

window.addCoin = async function (uid) {
    try {
        await updateDoc(doc(db, "users", uid), { coin: increment(1000) });
        alert("1000 Coins Added");
        await loadUsers();
    } catch (e) {
        alert(e.message);
    }
};

window.deductCoin = async function (uid) {
    try {
        await updateDoc(doc(db, "users", uid), { coin: increment(-1000) });
        alert("1000 Coins Deducted");
        await loadUsers();
    } catch (e) {
        alert(e.message);
    }
};

window.banUser = async function (uid) {
    if (uid === currentAdminId) return alert("Cannot ban yourself");
    const reason = prompt("Ban Reason");
    if (!reason) return;
    try {
        await updateDoc(doc(db, "users", uid), { status: "banned", ban_reason: reason });
        alert("User Banned");
        await loadUsers();
    } catch (e) {
        alert(e.message);
    }
};

window.unbanUser = async function (uid) {
    try {
        await updateDoc(doc(db, "users", uid), { status: "active", ban_reason: "" });
        alert("User Unbanned");
        await loadUsers();
    } catch (e) {
        alert(e.message);
    }
};
