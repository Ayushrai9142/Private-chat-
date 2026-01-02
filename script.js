import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded, onChildRemoved, remove } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// --- YOUR CONFIG (Isme tumhari keys hain) ---
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

// DOM Elements
const loginContainer = document.getElementById("login-container");
const chatScreen = document.getElementById("chat-screen");
const chatBox = document.getElementById("chat-box");
const msgInput = document.getElementById("message-input");
const imgInput = document.getElementById("image-input");

// Modal Elements
const modal = document.getElementById("custom-modal");
const modalTitle = document.getElementById("modal-title");
const modalInput = document.getElementById("modal-input");
const modalConfirm = document.getElementById("modal-confirm");
const modalCancel = document.getElementById("modal-cancel");

let currentUser = null;
let modalCallback = null; // Store function to run on confirm

// --- UI Helper Functions ---
function showModal(title, needsInput, callback) {
    modalTitle.innerText = title;
    modal.style.display = "flex";
    modalCallback = callback;

    if (needsInput) {
        modalInput.style.display = "block";
        modalInput.value = "";
        modalInput.focus();
    } else {
        modalInput.style.display = "none";
    }
}

function closeModal() {
    modal.style.display = "none";
    modalCallback = null;
}

modalCancel.addEventListener("click", closeModal);
modalConfirm.addEventListener("click", () => {
    if (modalCallback) modalCallback(modalInput.value);
    closeModal();
});

// --- Auth Logic ---
document.getElementById("login-btn").addEventListener("click", () => {
    signInWithEmailAndPassword(auth, document.getElementById("email").value, document.getElementById("password").value)
    .catch(e => showModal("Error: " + e.message, false, null));
});

document.getElementById("signup-btn").addEventListener("click", () => {
    createUserWithEmailAndPassword(auth, document.getElementById("email").value, document.getElementById("password").value)
    .then(() => showModal("Account Created! Login now.", false, null))
    .catch(e => showModal("Error: " + e.message, false, null));
});

document.getElementById("logout-btn").addEventListener("click", () => signOut(auth).then(() => location.reload()));

// Name Change
document.getElementById("profile-btn").addEventListener("click", () => {
    showModal("Change Your Name", true, (newName) => {
        if (newName && newName.trim() !== "") {
            updateProfile(currentUser, { displayName: newName }).then(() => {
                // Future messages will have new name
            });
        }
    });
});

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

    // AUTO NAME LOGIC: Agar naam set nahi hai, toh email ka pehla hissa le lo
    let displayName = currentUser.displayName;
    if (!displayName) {
        displayName = currentUser.email.split('@')[0];
    }

    push(ref(db, "messages"), {
        text: text,
        imageUrl: imageUrl,
        sender: currentUser.email,
        senderName: displayName,
        timestamp: Date.now()
    });
    msgInput.value = "";
}

document.getElementById("send-msg-btn").addEventListener("click", () => sendMessage(msgInput.value.trim()));
msgInput.addEventListener("keypress", (e) => { if(e.key === "Enter") sendMessage(msgInput.value.trim()); });

// Image Upload
document.getElementById("upload-trigger").addEventListener("click", () => imgInput.click());
imgInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.size < 100 * 1024) {
        const reader = new FileReader();
        reader.onload = (ev) => sendMessage("", ev.target.result);
        reader.readAsDataURL(file);
    } else {
        showModal("Image too big! Max 100KB.", false, null);
    }
});

// --- Messages & Delete ---
function loadMessages() {
    chatBox.innerHTML = "";
    onChildAdded(ref(db, "messages"), (snapshot) => {
        displayMessage(snapshot.val(), snapshot.key);
    });
    onChildRemoved(ref(db, "messages"), (snapshot) => {
        const el = document.getElementById(snapshot.key);
        if (el) el.remove();
    });
}

function displayMessage(data, key) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.id = key;

    const isMe = data.sender === currentUser.email;
    div.classList.add(isMe ? "my-message" : "other-message");

    // Click to Delete (Only my messages)
    if (isMe) {
        div.addEventListener("click", () => {
            showModal("Delete this message?", false, () => {
                remove(ref(db, "messages/" + key));
            });
        });
    }

    const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let html = `<div class="sender-name">${data.senderName}</div>`;
    if (data.imageUrl) html += `<img src="${data.imageUrl}" class="msg-img">`;
    if (data.text) html += `<div>${data.text}</div>`;
    html += `<div class="msg-time" style="font-size:9px; text-align:right; color:#777;">${time}</div>`;
    
    div.innerHTML = html;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

