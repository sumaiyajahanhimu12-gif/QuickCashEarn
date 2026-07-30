import {
    auth,
    db,
    onAuthStateChanged,
    signOut,
    doc,
    getDoc,
    addDoc,
    collection,
    updateDoc,
    increment,
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
        document.getElementById("coinBalance").innerText = userSnap.data().coin || 0;
    } catch (e) {
        alert(e.message);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("withdrawBtn");
    if (btn) btn.addEventListener("click", submitWithdraw);
});

async function submitWithdraw() {
    const msg = document.getElementById("withdrawMsg");
    const show = (t, c = "red") => { if (msg) { msg.style.color = c; msg.innerText = t; } else alert(t); };

    try {
        const user = auth.currentUser;
        if (!user) return show("Login Required");

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return show("User Not Found");
        const data = userSnap.data();

        if (data.status === "banned") return show("Account Suspended");

        // Pending check
        const pendingQ = query(collection(db, "withdraw_requests"), where("uid", "==", user.uid), where("status", "==", "pending"));
        if (!(await getDocs(pendingQ)).empty) return show("Already have pending request");

        const method = document.getElementById("method")?.value || "";
        const number = document.getElementById("number")?.value.trim() || "";
        const amount = Number(document.getElementById("amount")?.value) || 0;

        if (!number) return show("Enter Payment Number");
        if (!Number.isInteger(amount) || amount < 50000) return show("Minimum 50,000 Coins");
        if (data.coin < amount) return show("Insufficient Balance");
        if (!user.emailVerified) return show("Verify Email First");
        if ((data.active_days || 0) < 14) return show("14 Active Days Required");

        // Referral count
        const myCode = data.referral_code || "";
        if (!myCode) return show("Referral Code Missing");
        const refQ = query(collection(db, "users"), where("referred_by", "==", myCode));
        const refSnap = await getDocs(refQ);
        if (refSnap.size < 10) return show("Minimum 10 Referrals Required");

        // Top 10 referral coins
        let coins = [];
        refSnap.forEach(d => coins.push(d.data().coin || 0));
        coins.sort((a, b) => b - a);
        const top10 = coins.slice(0, 10).reduce((s, c) => s + c, 0);
        if (top10 < 100000) return show("Top 10 Referral Coins must be 100,000+");

        // Date 1-10
        const day = new Date().getDate();
        if (day < 1 || day > 10) return show("Withdraw only 1-10 date");

        const btn = document.getElementById("withdrawBtn");
        if (btn) btn.disabled = true;

        await addDoc(collection(db, "withdraw_requests"), {
            uid: user.uid,
            username: data.username || "",
            method,
            number,
            coin: amount,
            status: "pending",
            created_at: new Date().toISOString(),
            approved_at: "",
            approved_by: ""
        });

        await updateDoc(userRef, { coin: increment(-amount) });

        show("Withdraw Request Submitted", "green");
        setTimeout(() => window.location.href = "history.html", 1500);

    } catch (e) {
        console.error(e);
        show(e.message);
        const btn = document.getElementById("withdrawBtn");
        if (btn) btn.disabled = false;
    }
}
