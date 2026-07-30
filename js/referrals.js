import {
    auth,
    db,
    onAuthStateChanged,
    signOut,
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
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
        await loadReferrals(user.uid);
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
});

async function loadReferrals(uid) {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) return;

    const myCode = userSnap.data().referral_code || "";
    document.getElementById("myCode").innerText = myCode || "N/A";

    const refQ = query(collection(db, "users"), where("referred_by", "==", myCode));
    const refSnap = await getDocs(refQ);

    let total = 0;
    let coins = [];
    let html = "";

    refSnap.forEach(d => {
        total++;
        const data = d.data();
        const coin = data.coin || 0;
        coins.push(coin);
        html += `
            <div class="task-card">
                <h3>${data.username || "User"}</h3>
                <p>Coins: ${coin}</p>
                <p>Active Days: ${data.active_days || 0}</p>
                <p>Status: ${data.status || "active"}</p>
            </div>
            <hr>
        `;
    });

    coins.sort((a, b) => b - a);
    const top10 = coins.slice(0, 10).reduce((s, c) => s + c, 0);

    document.getElementById("totalReferrals").innerText = total;
    document.getElementById("top10Coins").innerText = top10;
    document.getElementById("referralList").innerHTML = html || "<p>No Referrals Yet</p>";
}
