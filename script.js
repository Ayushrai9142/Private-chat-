// Firebase libraries import kar rahe hain (CDN se direct)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Yahan apni Firebase Settings paste karo
const firebaseConfig = {
  apiKey: "AIzaSyAab5Ax1gKYWxNhWYX8jerbNG3hr0Ui7Fs",
authDomain: "private-chat-6d5e6.firebaseapp.com",
databaseURL: "https://private-chat-6d5e6-default-rtdb.asia-southeast1.firebasedatabase.app",
projectId: "private-chat-6d5e6",
storageBucket: "private-chat-6d5e6.firebasestorage.app",
messagingSenderId: "326060141451",
appId: "1:326060141451:web:f8f1671d4736e98d9ddd8e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// HTML Elements
const loginContainer = document.getElementById("login-container");
const chatScreen = document.getElementById("chat-screen");
const chatBox = document.getElementById("chat-box");
const msgInput = document.getElementById("message-input");

const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const sendBtn = document.getElementById("send-msg-btn");

let currentUser = null;

// --- Authentication Logic ---

// Login Button Click
loginBtn.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passInput.value;
    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => alert("Error: " + error.message));
});

// Signup Button Click
signupBtn.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passInput.value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => alert("Account created! Now you can login."))
        .catch((error) => alert("Error: " + error.message));
});

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loginContainer.style.display = "none";
        chatScreen.style.display = "flex"; // Show chat
        loadMessages(); // Load old messages
    } else {
        loginContainer.style.display = "block";
        chatScreen.style.display = "none";
    }
});

// --- Chat Logic ---

function sendMessage() {
    const text = msgInput.value.trim();
    if (text && currentUser) {
        // Database me message bhejo
        push(ref(db, "messages"), {
            text: text,
            sender: currentUser.email, // Pata chale kisne bheja
            timestamp: Date.now()
        });
        msgInput.value = "";
    }
}

// Send button click
sendBtn.addEventListener("click", sendMessage);

// Enter key se send karna
msgInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

// Messages receive karna (Real-time)
function loadMessages() {
    // Sirf ek baar listener lagana hai
    // Note: Is logic ko simplify kiya hai taki duplication na ho
    chatBox.innerHTML = ""; 
    
    onChildAdded(ref(db, "messages"), (snapshot) => {
        const data = snapshot.val();
        displayMessage(data);
    });
}

function displayMessage(data) {
    const div = document.createElement("div");
    div.classList.add("message");
    
    // Check karo message mera hai ya kisi aur ka
    if (data.sender === currentUser.email) {
        div.classList.add("my-message");
    } else {
        div.classList.add("other-message");
    }
    
    div.innerText = data.text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto scroll to bottom
}

