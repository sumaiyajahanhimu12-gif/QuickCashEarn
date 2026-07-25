import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.registerUser = async function () {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        alert("Registration Successful");

    } catch (error) {

        alert(error.message);

    }

}
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.loginUser = async function () {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        alert("Login Successful");

        window.location.href = "dashboard.html";

    } catch (error) {

        alert(error.message);

    }

}
