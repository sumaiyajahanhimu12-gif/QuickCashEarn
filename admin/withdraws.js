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

        const adminRef = doc(db, "users", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
            alert("User Not Found");
            return;
        }

        const adminData = adminSnap.data();

        if (adminData.status === "banned") {
            alert("Your Account Has Been Suspended");
            window.location.href = "../login.html";
            return;
        }

        if (adminData.role !== "admin") {
            alert("Access Denied");
            window.location.href = "../dashboard.html";
            return;
        }

        await loadWithdraws();

    } catch (error) {
        alert(error.message);
    }

});

async function loadWithdraws() {

    const container = document.getElementById("withdrawContainer");
    if (!container) return;

    container.innerHTML = "";

    try {
        const snapshot = await getDocs(collection(db, "withdraw_requests"));

        if (snapshot.empty) {
            container.innerHTML = "<p>No Withdraw Requests</p>";
            return;
        }

        let hasPending = false;

        snapshot.forEach((requestDoc) => {
            const data = requestDoc.data();

            if (data.status !== "pending") {
                return;
            }

            hasPending = true;

            container.innerHTML += `
            <div class="task-card">
                <h3>${data.username || "User"}</h3>
                <p>Method: ${data.method}</p>
                <p>Number: ${data.number}</p>
                <p>Coins: ${data.coin}</p>
                <p>Status: ${data.status}</p>

                <button onclick="approveWithdraw('${requestDoc.id}')">Approve</button>
                <button onclick="rejectWithdraw('${requestDoc.id}')">Reject</button>
            </div>
            <hr>
            `;
        });

        if (!hasPending) {
            container.innerHTML = "<p>No Withdraw Requests</p>";
        }
    } catch (error) {
        console.error("Error loading withdraws:", error);
    }

}

window.approveWithdraw = async function (requestId) {

    try {

        const requestRef = doc(db, "withdraw_requests", requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            alert("Request Not Found");
            return;
        }

        const requestData = requestSnap.data();

        if (requestData.status !== "pending") {
            alert("Request Already Processed");
            return;
        }

        await updateDoc(requestRef, {
            status: "approved",
            approved_at: new Date().toISOString(),
            approved_by: auth.currentUser ? auth.currentUser.uid : ""
        });

        alert("Withdraw Approved");
        location.reload();

    } catch (error) {
        alert(error.message);
    }

};

window.rejectWithdraw = async function (requestId) {

    try {

        const requestRef = doc(db, "withdraw_requests", requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            alert("Request Not Found");
            return;
        }

        const requestData = requestSnap.data();

        if (requestData.status !== "pending") {
            alert("Request Already Processed");
            return;
        }

        await updateDoc(requestRef, {
            status: "rejected",
            approved_at: new Date().toISOString(),
            approved_by: auth.currentUser ? auth.currentUser.uid : ""
        });

        await updateDoc(doc(db, "users", requestData.uid), {
            coin: increment(requestData.coin)
        });

        alert("Withdraw Rejected & Coins Refunded");
        location.reload();

    } catch (error) {
        alert(error.message);
    }

};
