import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded, onChildRemoved, remove } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// --- TUMHARI ASLI KEYS (Direct Copy-Paste Ready) ---
const firebaseConfig = {
 apiKey: "AIzaSyBiXDDBTUvgeT99KVTiz9Q-VXtklqBLbwA",
 authDomain: "private-chat-5c4c9.firebaseapp.com",
 databaseURL: "https://private-chat-5c4c9-default-rtdb.asia-southeast1.firebasedatabase.app",
 projectId: "private-chat-5c4c9",
 storageBucket: "private-chat-5c4c9.firebasestorage.app",
 messagingSenderId: "505196940742",
 appId: "1:505196940742:web:313cf8d64fa9cb478d76c7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Elements
const loginContainer = document.getElementById("login-container");
const chatScreen = document.getElementById("chat-screen");
const chatBox = document.getElementById("chat-box");
const msgInput = document.getElementById("message-input");
const imgInput = document.getElementById("image-input");

// Buttons
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtn = document.getElementById("logout-btn");
const sendBtn = document.getElementById("send-msg-btn");
const uploadBtn = document.getElementById("upload-trigger");
const profileBtn = document.getElementById("profile-btn");

let currentUser = null;

// --- Auth Functions ---
loginBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, pass).catch(e => alert(e.message));
});

signupBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    createUserWithEmailAndPassword(auth, email, pass)
        .then(() => alert("Account Created! Please Login."))
        .catch(e => alert(e.message));
});

if(logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth).then(() => location.reload());
    });
}

// Update Name Feature
if(profileBtn) {
    profileBtn.addEventListener("click", () => {
        const newName = prompt("Enter your Display Name:", currentUser.displayName || "");
        if (newName) {
            updateProfile(currentUser, { displayName: newName }).then(() => {
                alert("Name Updated! Next messages will show new name.");
            });
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loginContainer.style.display = "none";
        chatScreen.style.display = "flex";
        loadMessages();
    } else {
        loginContainer.style.display = "flex";
        chatScreen.style.display = "none";
    }
});

// --- Chat Logic ---

function sendMessage(text = "", imageUrl = null) {
    if ((!text && !imageUrl) || !currentUser) return;

    // Use displayName if available, else email prefix
    const name = currentUser.displayName || currentUser.email.split('@')[0];

    push(ref(db, "messages"), {
        text: text,
        imageUrl: imageUrl,
        sender: currentUser.email,
        senderName: name,
        timestamp: Date.now()
    });
    msgInput.value = "";
}

sendBtn.addEventListener("click", () => sendMessage(msgInput.value.trim()));
msgInput.addEventListener("keypress", (e) => { if(e.key === "Enter") sendMessage(msgInput.value.trim()); });

// --- Image Upload Logic (Base64 < 100KB) ---
if(uploadBtn) {
    uploadBtn.addEventListener("click", () => imgInput.click());

    imgInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size Check (100KB Limit = 100 * 1024 bytes)
        if (file.size > 100 * 1024) {
            alert("Image too big! Please select image less than 100KB.");
            imgInput.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            sendMessage("", event.target.result); // Send image as Base64 string
        };
        reader.readAsDataURL(file);
    });
}

// --- Display & Delete Logic ---
function loadMessages() {
    chatBox.innerHTML = "";
    
    // Message Aaya
    onChildAdded(ref(db, "messages"), (snapshot) => {
        const msg = snapshot.val();
        const key = snapshot.key; // Message ID for deletion
        displayMessage(msg, key);
    });

    // Message Delete Hua
    onChildRemoved(ref(db, "messages"), (snapshot) => {
        const key = snapshot.key;
        const msgDiv = document.getElementById(key);
        if (msgDiv) msgDiv.remove();
    });
}

function displayMessage(data, key) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.id = key; // ID set kar rahe hain taaki delete kar sakein

    const isMe = data.sender === currentUser.email;
    div.classList.add(isMe ? "my-message" : "other-message");

    const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Content Build
    let contentHtml = `<div class="sender-name">${data.senderName || 'User'}</div>`;
    
    if (data.imageUrl) {
        contentHtml += `<img src="${data.imageUrl}" class="msg-img">`;
    }
    if (data.text) {
        contentHtml += `<div>${data.text}</div>`;
    }

    contentHtml += `<div class="msg-time">${time}`;
    
    // Delete Button (Sirf mere message pe)
    if (isMe) {
        contentHtml += `<span class="delete-btn" onclick="deleteMsg('${key}')">🗑</span>`;
    }
    contentHtml += `</div>`;

    div.innerHTML = contentHtml;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Global function to handle delete click
window.deleteMsg = function(key) {
    if (confirm("Delete this message?")) {
        remove(ref(db, "messages/" + key));
    }
};

