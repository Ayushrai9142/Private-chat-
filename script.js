// Firebase libraries import kar rahe hain (CDN se direct)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Tumhari Firebase Config (Jo tumne di thi)
const firebaseConfig = {
 apiKey: "AIzaSyBiXDDBTUvgeT99KVTiz9Q-VXtklqBLbwA",
 authDomain: "private-chat-5c4c9.firebaseapp.com",
 databaseURL: "https://private-chat-5c4c9-default-rtdb.asia-southeast1.firebasedatabase.app",
 projectId: "private-chat-5c4c9",
 storageBucket: "private-chat-5c4c9.firebasestorage.app",
 messagingSenderId: "505196940742",
 appId: "1:505196940742:web:313cf8d64fa9cb478d76c7"
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

// Logout Button Logic (Naya Add kiya hai)
// Note: Make sure index.html me logout-btn id wala button ho
const logoutBtn = document.getElementById("logout-btn");
if(logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth).then(() => {
            alert("Logged out!");
            location.reload(); // Page refresh karega
        }).catch((error) => {
            alert("Error logging out: " + error.message);
        });
    });
}

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
    chatBox.innerHTML = ""; 
    
    onChildAdded(ref(db, "messages"), (snapshot) => {
        const data = snapshot.val();
        displayMessage(data);
    });
}

// Naya Display Function (Time aur Name ke sath)
function displayMessage(data) {
    const div = document.createElement("div");
    div.classList.add("message");
    
    // Check karo message mera hai ya kisi aur ka
    if (data.sender === currentUser.email) {
        div.classList.add("my-message");
    } else {
        div.classList.add("other-message");
    }
    
    // Time Format Karna
    const date = new Date(data.timestamp);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Name nikalna (Email ka pehla hissa)
    const senderName = data.sender.split('@')[0];

    // HTML set karna (Name + Message + Time)
    div.innerHTML = `
        <div style="font-size:10px; opacity:0.7; margin-bottom:2px; font-weight:bold;">${senderName}</div>
        <div>${data.text}</div>
        <div style="font-size:9px; opacity:0.6; text-align:right; margin-top:4px;">${timeString}</div>
    `;
    
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto scroll to bottom
}

