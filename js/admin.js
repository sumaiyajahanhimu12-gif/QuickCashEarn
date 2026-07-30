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

        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            alert("User not found");
            window.location.href = "../login.html";
            return;
        }

        const data = userDoc.data();

        // BAN PROTECTION
        if (data.status === "banned") {
            alert("Your Account Has Been Suspended");
            window.location.href = "../login.html";
            return;
        }

        // ADMIN CHECK
        if (data.role !== "admin") {
            alert("Access Denied");
            window.location.href = "../dashboard.html";
            return;
        }

        await loadStats();
        await loadTasks();

    } catch (error) {
        alert(error.message);
    }

});

async function loadStats() {

    try {
        const usersSnapshot = await getDocs(collection(db, "users"));

        let totalUsers = 0;
        let totalCoins = 0;

        usersSnapshot.forEach((userDoc) => {
            totalUsers++;
            totalCoins += userDoc.data().coin || 0;
        });

        const totalUsersElem = document.getElementById("totalUsers");
        if (totalUsersElem) totalUsersElem.innerText = totalUsers;

        const totalCoinsElem = document.getElementById("totalCoins");
        if (totalCoinsElem) totalCoinsElem.innerText = totalCoins;
    } catch (error) {
        console.error("Error loading stats:", error);
    }

}

window.createTask = async function () {

    const nameInput = document.getElementById("taskName");
    const linkInput = document.getElementById("taskLink");
    const coinInput = document.getElementById("taskCoin");
    const limitInput = document.getElementById("taskLimit");
    const codeInput = document.getElementById("taskCode");
    const typeInput = document.getElementById("taskType");
    const statusInput = document.getElementById("taskStatus");

    const name = nameInput ? nameInput.value.trim() : "";
    const link = linkInput ? linkInput.value.trim() : "";
    const coin = coinInput ? parseInt(coinInput.value) : 0;
    const limitValue = limitInput ? limitInput.value : "";
    const code = codeInput ? codeInput.value.trim() : "";
    const type = typeInput ? typeInput.value : "daily";
    const status = statusInput ? statusInput.value : "published";

    if (!name || !link || !coin) {
        alert("Please fill required fields");
        return;
    }

    try {

        await addDoc(
            collection(db, "tasks"),
            {
                name,
                link,
                coin,
                limit: limitValue ? parseInt(limitValue) : null,
                code: code || "",
                type,
                status,
                completed_count: 0,
                created_at: new Date().toISOString()
            }
        );

        alert("Task Created Successfully");

        if (nameInput) nameInput.value = "";
        if (linkInput) linkInput.value = "";
        if (coinInput) coinInput.value = "";
        if (limitInput) limitInput.value = "";
        if (codeInput) codeInput.value = "";

        await loadTasks();

    } catch (error) {
        alert(error.message);
    }

};

async function loadTasks() {

    const container = document.getElementById("tasksContainer");
    if (!container) return;

    container.innerHTML = "";

    try {
        const snapshot = await getDocs(collection(db, "tasks"));

        if (snapshot.empty) {
            container.innerHTML = "<p>No Tasks Found</p>";
            return;
        }

        snapshot.forEach((taskDoc) => {
            const task = taskDoc.data();

            container.innerHTML += `
            <div class="task-card">
                <h3>${task.name}</h3>
                <p>Coins: ${task.coin}</p>
                <p>Type: ${task.type}</p>
                <p>Status: ${task.status}</p>
                <p>Completed: ${task.completed_count || 0}</p>

                <button onclick="deleteTask('${taskDoc.id}')">Delete</button>
                <button onclick="pauseTask('${taskDoc.id}')">Pause</button>
                <button onclick="publishTask('${taskDoc.id}')">Publish</button>
            </div>
            <hr>
            `;
        });
    } catch (error) {
        console.error("Error loading tasks:", error);
    }

}

window.deleteTask = async function(taskId) {

    try {

        if (!confirm("Delete this task?")) return;

        await deleteDoc(doc(db, "tasks", taskId));

        alert("Task Deleted");
        await loadTasks();

    } catch (error) {
        alert(error.message);
    }

};

window.pauseTask = async function(taskId) {

    try {

        await updateDoc(
            doc(db, "tasks", taskId),
            {
                status: "pending"
            }
        );

        alert("Task Paused");
        await loadTasks();

    } catch (error) {
        alert(error.message);
    }

};

window.publishTask = async function(taskId) {

    try {

        await updateDoc(
            doc(db, "tasks", taskId),
            {
                status: "published"
            }
        );

        alert("Task Published");
        await loadTasks();

    } catch (error) {
        alert(error.message);
    }

};
    
