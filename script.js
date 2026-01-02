import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded, onChildRemoved, remove } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// --- YOUR CONFIG ---
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
const authErrorMsg = document.getElementById("auth-error-msg");
const toastBox = document.getElementById("toast-box");

// Modal Elements
const modal = document.getElementById("custom-modal");
const modalTitle = document.getElementById("modal-title");
const modalInput = document.getElementById("modal-input");
const modalConfirm = document.getElementById("modal-confirm");
const modalCancel = document.getElementById("modal-cancel");

let currentUser = null;
let modalCallback = null;

// --- Helper: Show Auth Error (Screen par Text) ---
function showAuthError(message) {
    // English error ko Hindi/Easy language me convert karna
    let cleanMsg = message;
    if(message.includes("user-not-found")) cleanMsg = "Account nahi mila. Sign Up karein.";
    else if(message.includes("wrong-password")) cleanMsg = "Password galat hai.";
    else if(message.includes("email-already-in-use")) cleanMsg = "Email pehle se use ho raha hai.";
    else if(message.includes("weak-password")) cleanMsg = "Password kamjor hai (6+ words rakhein).";
    else if(message.includes("invalid-email")) cleanMsg = "Email dhang se likhein.";
    
    authErrorMsg.innerText = cleanMsg;
    authErrorMsg.style.display = "block";
    
    // 3 second baad error hata do
    setTimeout(() => { authErrorMsg.style.display = "none"; }, 4000);
}

// --- Helper: Show Toast (Notification) ---
function showToast(text) {
    toastBox.innerText = text;
    toastBox.className = "show";
    setTimeout(() => { toastBox.className = toastBox.className.replace("show", ""); }, 3000);
}

// --- Helper: Custom Modal ---
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
function closeModal() { modal.style.display = "none"; modalCallback = null; }
modalCancel.addEventListener("click", closeModal);
modalConfirm.addEventListener("click", () => {
    if (modalCallback) modalCallback(modalInput.value);
    closeModal();
});

// --- Auth Logic ---
document.getElementById("login-btn").addEventListener("click", () => {
    authErrorMsg.style.display = "none";
    signInWithEmailAndPassword(auth, document.getElementById("email").value, document.getElementById("password").value)
    .catch(e => showAuthError(e.message));
});

document.getElementById("signup-btn").addEventListener("click", () => {
    authErrorMsg.style.display = "none";
    createUserWithEmailAndPassword(auth, document.getElementById("email").value, document.getElementById("password").value)
    .then(() => showToast("Account ban gaya! Ab Login karein."))
    .catch(e => showAuthError(e.message));
});

document.getElementById("logout-btn").addEventListener("click", () => signOut(auth).then(() => location.reload()));

document.getElementById("profile-btn").addEventListener("click", () => {
    showModal("New Name:", true, (newName) => {
        if (newName && newName.trim() !== "") {
            updateProfile(currentUser, { displayName: newName }).then(() => showToast("Name change ho gaya!"));
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
    let displayName = currentUser.displayName || currentUser.email.split('@')[0];
    push(ref(db, "messages"), {
        text: text, imageUrl: imageUrl, sender: currentUser.email, senderName: displayName, timestamp: Date.now()
    });
    msgInput.value = "";
}

document.getElementById("send-msg-btn").addEventListener("click", () => sendMessage(msgInput.value.trim()));
msgInput.addEventListener("keypress", (e) => { if(e.key === "Enter") sendMessage(msgInput.value.trim()); });

document.getElementById("upload-trigger").addEventListener("click", () => imgInput.click());
imgInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.size < 100 * 1024) {
        const reader = new FileReader();
        reader.onload = (ev) => sendMessage("", ev.target.result);
        reader.readAsDataURL(file);
    } else {
        showToast("Image size 100KB se kam rakhein!");
    }
});

function loadMessages() {
    chatBox.innerHTML = "";
    onChildAdded(ref(db, "messages"), (s) => displayMessage(s.val(), s.key));
    onChildRemoved(ref(db, "messages"), (s) => {
        const el = document.getElementById(s.key);
        if (el) el.remove();
    });
}

function displayMessage(data, key) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.id = key;
    const isMe = data.sender === currentUser.email;
    div.classList.add(isMe ? "my-message" : "other-message");

    // Click to Delete (Modal use karega)
    if (isMe) {
        div.addEventListener("click", () => {
            showModal("Delete karein?", false, () => {
                remove(ref(db, "messages/" + key));
                showToast("Message deleted");
            });
        });
    }

    const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let html = `<div class="sender-name">${data.senderName}</div>`;
    if (data.imageUrl) html += `<img src="${data.imageUrl}" class="msg-img">`;
    if (data.text) html += `<div>${data.text}</div>`;
    html += `<div style="font-size:9px; text-align:right; color:#777; margin-top:3px;">${time}</div>`;
    
    div.innerHTML = html;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

