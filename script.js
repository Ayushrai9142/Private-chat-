import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded, onChildRemoved, remove, set, onValue, off } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// --- CONFIG ---
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

// Screens
const loginContainer = document.getElementById("login-container");
const usersScreen = document.getElementById("users-screen");
const chatScreen = document.getElementById("chat-screen");

// Elements
const usersListEl = document.getElementById("users-list");
const chatBox = document.getElementById("chat-box");
const chatUserName = document.getElementById("chat-user-name");
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
let currentChatRoomId = null; 
let modalCallback = null;

// Helpers
function showToast(text) {
    toastBox.innerText = text;
    toastBox.className = "show";
    setTimeout(() => { toastBox.className = toastBox.className.replace("show", ""); }, 3000);
}
function showAuthError(msg) {
    authErrorMsg.innerText = msg;
    authErrorMsg.style.display = "block";
    setTimeout(() => { authErrorMsg.style.display = "none"; }, 4000);
}
function showModal(title, needsInput, callback) {
    modalTitle.innerText = title;
    modal.style.display = "flex";
    modalCallback = callback;
    if (needsInput) { modalInput.style.display = "block"; modalInput.value = ""; modalInput.focus(); }
    else { modalInput.style.display = "none"; }
}
modalCancel.addEventListener("click", () => { modal.style.display = "none"; modalCallback = null; });
modalConfirm.addEventListener("click", () => { if (modalCallback) modalCallback(modalInput.value); modal.style.display = "none"; });

// Auth
function writeUserData(user) {
    const name = user.email.split('@')[0];
    set(ref(db, 'users/' + user.uid), { email: user.email, name: name, uid: user.uid });
}

document.getElementById("login-btn").addEventListener("click", () => {
    signInWithEmailAndPassword(auth, document.getElementById("email").value, document.getElementById("password").value)
    .catch(e => showAuthError(e.message));
});

document.getElementById("signup-btn").addEventListener("click", () => {
    createUserWithEmailAndPassword(auth, document.getElementById("email").value, document.getElementById("password").value)
    .then((cred) => { writeUserData(cred.user); showToast("Account created!"); })
    .catch(e => showAuthError(e.message));
});

document.getElementById("logout-btn").addEventListener("click", () => signOut(auth).then(() => location.reload()));

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        writeUserData(user);
        loginContainer.style.display = "none";
        usersScreen.style.display = "flex";
        loadUserList();
    } else {
        loginContainer.style.display = "flex";
        usersScreen.style.display = "none";
        chatScreen.style.display = "none";
    }
});

// --- LIST LOGIC (GROUP + USERS) ---
function loadUserList() {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
        usersListEl.innerHTML = "";
        
        // 1. ADD GROUP CHAT OPTION (Top pe)
        const groupDiv = document.createElement("div");
        groupDiv.className = "user-card";
        groupDiv.innerHTML = `
            <div class="user-avatar group-avatar">🌍</div>
            <div>
                <div class="user-info-name">Global Group Chat</div>
                <div class="user-info-email">Talk with everyone</div>
            </div>
        `;
        groupDiv.addEventListener("click", () => openChat(null, true)); // True means Group
        usersListEl.appendChild(groupDiv);

        // 2. ADD PRIVATE USERS
        const users = snapshot.val();
        if (!users) return;
        Object.values(users).forEach(user => {
            if (user.uid === currentUser.uid) return; // Hide self

            const div = document.createElement("div");
            div.className = "user-card";
            div.innerHTML = `
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="user-info-name">${user.name}</div>
                    <div class="user-info-email">${user.email}</div>
                </div>
            `;
            div.addEventListener("click", () => openChat(user, false)); // False means Private
            usersListEl.appendChild(div);
        });
    });
}

// --- OPEN CHAT ---
function openChat(targetUser, isGroup) {
    if (isGroup) {
        currentChatRoomId = "global_group_chat";
        chatUserName.innerText = "🌍 Global Group";
    } else {
        chatUserName.innerText = targetUser.name;
        // Private ID logic
        const ids = [currentUser.uid, targetUser.uid].sort();
        currentChatRoomId = ids[0] + "_" + ids[1];
    }

    usersScreen.style.display = "none";
    chatScreen.style.display = "flex";
    loadMessages();
}

document.getElementById("back-btn").addEventListener("click", () => {
    if (currentChatRoomId) off(ref(db, "messages/" + currentChatRoomId));
    chatScreen.style.display = "none";
    usersScreen.style.display = "flex";
    currentChatRoomId = null;
});

// --- MESSAGES ---
function loadMessages() {
    chatBox.innerHTML = "";
    if (!currentChatRoomId) return;

    const roomRef = ref(db, "messages/" + currentChatRoomId);
    onChildAdded(roomRef, (s) => displayMessage(s.val(), s.key));
    onChildRemoved(roomRef, (s) => {
        const el = document.getElementById(s.key);
        if (el) el.remove();
    });
}

function sendMessage(text = "", imageUrl = null) {
    if ((!text && !imageUrl) || !currentChatRoomId) return;
    const name = currentUser.email.split('@')[0];
    
    push(ref(db, "messages/" + currentChatRoomId), {
        text: text, imageUrl: imageUrl, sender: currentUser.email, senderName: name, timestamp: Date.now()
    });
    msgInput.value = "";
}

function displayMessage(data, key) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.id = key;
    
    // Check if message is mine
    const isMe = data.sender === currentUser.email;
    div.classList.add(isMe ? "my-message" : "other-message");

    const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let html = `<span class="sender-name">${data.senderName}</span>`;
    if (data.imageUrl) html += `<img src="${data.imageUrl}" class="msg-img">`;
    if (data.text) html += `<div>${data.text}</div>`;
    html += `<span class="msg-time">${time}</span>`;
    
    div.innerHTML = html;

    if (isMe) {
        div.addEventListener("click", () => {
            showModal("Delete Message?", false, () => {
                remove(ref(db, "messages/" + currentChatRoomId + "/" + key));
                showToast("Deleted");
            });
        });
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Input Handlers
document.getElementById("send-msg-btn").addEventListener("click", () => sendMessage(msgInput.value.trim()));
msgInput.addEventListener("keypress", (e) => { if(e.key === "Enter") sendMessage(msgInput.value.trim()); });
document.getElementById("upload-trigger").addEventListener("click", () => imgInput.click());
imgInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.size < 100 * 1024) {
        const reader = new FileReader();
        reader.onload = (ev) => sendMessage("", ev.target.result);
        reader.readAsDataURL(file);
    } else { showToast("File too big (>100KB)"); }
});
             
