import {
    auth,
    db,
    onAuthStateChanged,
    signOut,
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from "./firebase.js";

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
        await loadMyHistory(user.uid);
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
});

async function loadMyHistory(uid) {
    const container = document.getElementById("historyContainer");
    if (!container) return;
    container.innerHTML = "<h2>My Withdraw History</h2>";

    const historyQ = query(collection(db, "withdraw_requests"), where("uid", "==", uid));
    const historySnap = await getDocs(historyQ);

    if (historySnap.empty) {
        container.innerHTML += "<p>No Withdraw History Found</p>";
    } else {
        historySnap.forEach(docSnap => {
            const d = docSnap.data();
            let statusText = d.status === "approved" ? "✅ Approved" : d.status === "rejected" ? "❌ Rejected" : "⏳ Pending";
            container.innerHTML += `
                <div class="task-card">
                    <h3>${d.coin} Coins</h3>
                    <p>Method: ${d.method}</p>
                    <p>Number: ${d.number}</p>
                    <p>Status: ${statusText}</p>
                    <p>Date: ${d.created_at || ""}</p>
                </div>
                <hr>
            `;
        });
    }
    await loadPublicProofs(container);
}

async function loadPublicProofs(container) {
    container.innerHTML += `<br><br><h2>Recent Payment Proofs</h2>`;
    const snap = await getDocs(collection(db, "withdraw_requests"));
    let found = false;

    snap.forEach(docSnap => {
        const d = docSnap.data();
        if (d.status !== "approved") return;
        found = true;
        let masked = "Hidden";
        if (d.number && d.number.toString().length >= 11) {
            const n = d.number.toString();
            masked = n.substring(0, 5) + "****" + n.substring(n.length - 2);
        }
        container.innerHTML += `
            <div class="task-card">
                <h3>${d.username || "User"}</h3>
                <p>Method: ${d.method}</p>
                <p>Number: ${masked}</p>
                <p>Amount: ${d.coin} Coins</p>
                <p>Status: ✅ Paid</p>
            </div>
            <hr>
        `;
    });
    if (!found) container.innerHTML += "<p>No Payment Proof Available Yet</p>";
}
