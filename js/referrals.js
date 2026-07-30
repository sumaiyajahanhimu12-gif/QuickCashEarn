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

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            alert("User not found");
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }

        const userData = userSnap.data();

        // BAN PROTECTION
        if (userData.status === "banned") {
            alert(
                "Your Account Has Been Suspended\n\nReason:\n" +
                (userData.ban_reason || "Policy Violation")
            );
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }

        await loadReferrals(user.uid);

    } catch (error) {
        console.error(error);
        alert(error.message);
    }

});

async function loadReferrals(uid) {

    const userSnap = await getDoc(doc(db, "users", uid));

    if (!userSnap.exists()) {
        return;
    }

    const userData = userSnap.data();
    const myCode = userData.referral_code;

    const myCodeElem = document.getElementById("myCode");
    if (myCodeElem) {
        myCodeElem.innerText = myCode || "N/A";
    }

    const referralsQuery = query(
        collection(db, "users"),
        where("referred_by", "==", myCode)
    );

    const referralsSnap = await getDocs(referralsQuery);

    let totalReferrals = 0;
    let validReferrals = 0;
    let referralCoins = [];
    let html = "";

    referralsSnap.forEach((docSnap) => {
        totalReferrals++;
        const data = docSnap.data();
        const coin = data.coin || 0;

        if (coin > 0) {
            validReferrals++;
        }

        referralCoins.push(coin);

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

    referralCoins.sort((a, b) => b - a);

    const top10Coins = referralCoins
        .slice(0, 10)
        .reduce((sum, coin) => sum + coin, 0);

    const totalRefElem = document.getElementById("totalReferrals");
    if (totalRefElem) totalRefElem.innerText = totalReferrals;

    const validRefElem = document.getElementById("validReferrals");
    if (validRefElem) validRefElem.innerText = validReferrals;

    const top10CoinsElem = document.getElementById("top10Coins");
    if (top10CoinsElem) top10CoinsElem.innerText = top10Coins;

    const referralListElem = document.getElementById("referralList");
    if (referralListElem) {
        referralListElem.innerHTML = html || "<p>No Referrals Yet</p>";
    }

}

