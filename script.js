import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded, onChildRemoved, remove } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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

// --- Helpers ---
function showAuthError(message) {
    let cleanMsg = message;
    if(message.includes("user-not-found")) cleanMsg = "User not found. Please Sign Up.";
    else if(message.includes("wrong-password")) cleanMsg = "Wrong password.";
    else if(message.includes("email-already-in-use")) cleanMsg = "Email already in use.";
    else if(message.includes("weak-password")) cleanMsg = "Password is too weak.";
    else if(message.includes("invalid-email")) cleanMsg = "Invalid email address.";
    
    authErrorMsg.innerText = cleanMsg;
    authErrorMsg.style.display = "block";
    setTimeout(() => { authErrorMsg.style.display = "none"; }, 4000);
}

function showToast(text) {
    toastBox.innerText = text;
    toastBox.className = "show";
    setTimeout(() => { toastBox.className = toastBox.className.replace("show", ""); }, 3000);
}

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

// --- Auth ---
document.getElementById("login-btn").addEventListener("click", () => {
    authErrorMsg.style.display = "none";
    signInWithEmailAndPassword(auth, document.getElementById("email").value, document.getElementById("password").value)
    .catch(e => showAuthError(e.message));
});

document.getElementById("signup-btn").addEventListener("click", () => {
    authErrorMsg.style.display = "none";
    createUserWithEmailAndPassword(auth, document.getElementById("email").value, document.getElementById("password").value)
    .then(() => showToast("Account created! Please Login."))
    .catch(e => showAuthError(e.message));
});

document.getElementById("logout-btn").addEventListener("click", () => signOut(auth).then(() => location.reload()));

document.getElementById("profile-btn").addEventListener("click", () => {
    showModal("Change Display Name", true, (newName) => {
        if (newName && newName.trim() !== "") {
            updateProfile(currentUser, { displayName: newName }).then(() => showToast("Name updated successfully!"));
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

// --- Chat ---
function sendMessage(text = "", imageUrl = null) {
    if ((!text && !imageUrl) || !currentUser) return;
    
    let displayName = currentUser.displayName;
    if (!displayName) {
        displayName = currentUser.email.split('@')[0];
    }

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
        showToast("Image too big! Max 100KB allowed.");
    }
});

// --- Messages ---
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

    const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Sirf content dikhayenge (Trash Icon Removed)
    let html = `<span class="sender-name">${data.senderName}</span>`;
    if (data.imageUrl) html += `<img src="${data.imageUrl}" class="msg-img">`;
    if (data.text) html += `<div>${data.text}</div>`;
    
    html += `<span class="msg-time">${time}</span>`;
    div.innerHTML = html;

    // HIDDEN DELETE: Pure message pe click karne par delete puchega
    if (isMe) {
        div.addEventListener("click", () => {
            showModal("Delete this message?", false, () => {
                remove(ref(db, "messages/" + key));
                showToast("Message deleted");
            });
        });
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

