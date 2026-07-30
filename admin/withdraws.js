import {
    auth,
    db,
    onAuthStateChanged,
    doc,
    getDoc,
    collection,
    getDocs,
    updateDoc,
    increment
} from "../js/firebase.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }
    try {
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
        await loadWithdraws();
    } catch (e) {
        alert(e.message);
    }
});

async function loadWithdraws() {
    const container = document.getElementById("withdrawContainer");
    if (!container) return;
    container.innerHTML = "";

    try {
        const snap = await getDocs(collection(db, "withdraw_requests"));
        let hasPending = false;

        snap.forEach(reqDoc => {
            const data = reqDoc.data();
            if (data.status !== "pending") return;
            hasPending = true;
            container.innerHTML += `
                <div class="task-card">
                    <h3>${data.username || "User"}</h3>
                    <p>Method: ${data.method}</p>
                    <p>Number: ${data.number}</p>
                    <p>Coins: ${data.coin}</p>
                    <p>Status: ${data.status}</p>
                    <button onclick="approveWithdraw('${reqDoc.id}')">Approve</button>
                    <button onclick="rejectWithdraw('${reqDoc.id}')">Reject</button>
                </div>
                <hr>
            `;
        });

        if (!hasPending) container.innerHTML = "<p>No Pending Withdraw Requests</p>";
    } catch (e) {
        console.error(e);
    }
}

window.approveWithdraw = async function (requestId) {
    try {
        const requestRef = doc(db, "withdraw_requests", requestId);
        const snap = await getDoc(requestRef);
        if (!snap.exists()) return alert("Request Not Found");
        if (snap.data().status !== "pending") return alert("Already Processed");

        await updateDoc(requestRef, {
            status: "approved",
            approved_at: new Date().toISOString(),
            approved_by: auth.currentUser?.uid || ""
        });
        alert("Approved");
        await loadWithdraws();
    } catch (e) {
        alert(e.message);
    }
};

window.rejectWithdraw = async function (requestId) {
    try {
        const requestRef = doc(db, "withdraw_requests", requestId);
        const snap = await getDoc(requestRef);
        if (!snap.exists()) return alert("Request Not Found");
        const data = snap.data();
        if (data.status !== "pending") return alert("Already Processed");

        await updateDoc(requestRef, {
            status: "rejected",
            approved_at: new Date().toISOString(),
            approved_by: auth.currentUser?.uid || ""
        });
        await updateDoc(doc(db, "users", data.uid), {
            coin: increment(data.coin)
        });
        alert("Rejected & Coins Refunded");
        await loadWithdraws();
    } catch (e) {
        alert(e.message);
    }
};
