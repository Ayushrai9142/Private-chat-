
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded, onChildRemoved, remove, set, onValue, off, update, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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
const profileSection = document.getElementById("profile-section");
const myUidText = document.getElementById("my-uid-text");
const copyUidBtn = document.getElementById("copy-uid-btn");
const requestsSection = document.getElementById("requests-section");
const requestsList = document.getElementById("requests-list");

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

// MODAL FUNCTION (Handles all popups)
function showModal(title, type, callback) {
    modalTitle.innerText = title;
    modal.style.display = "flex";
    modalCallback = callback;
    
    // Reset Views
    modalInput.style.display = "none";
    profileSection.style.display = "none";
    requestsSection.style.display = "none";
    modalConfirm.style.display = "inline-block";

    if (type === "input") {
        // Simple confirmation or input
        modalInput.style.display = "block";
        modalInput.value = "";
        modalInput.focus();
    } 
    else if (type === "profile") {
        // Profile View (Copy ID + Change Name)
        profileSection.style.display = "block";
        myUidText.innerText = currentUser.uid;
        modalInput.style.display = "block"; 
        modalInput.value = currentUser.displayName || "";
        modalInput.placeholder = "Change Name";
    }
    else if (type === "add_friend") {
        // Add Friend View (Input + Request List)
        modalInput.style.display = "block";
        modalInput.placeholder = "Paste User ID here";
        requestsSection.style.display = "block";
        loadFriendRequests();
    }
    else {
        // Just Confirmation (Delete)
        modalConfirm.innerText = "Yes";
    }
}

modalCancel.addEventListener("click", () => { modal.style.display = "none"; modalCallback = null; });
modalConfirm.addEventListener("click", () => { 
    if (modalCallback) modalCallback(modalInput.value); 
    modal.style.display = "none"; 
    modalConfirm.innerText = "OK"; // Reset text
});

// --- AUTH ---
function writeUserData(user) {
    const name = user.displayName || user.email.split('@')[0];
    update(ref(db, 'users/' + user.uid), { email: user.email, name: name, uid: user.uid });
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
        loadFriendsList();
    } else {
        loginContainer.style.display = "flex";
        usersScreen.style.display = "none";
        chatScreen.style.display = "none";
    }
});

// --- PROFILE & COPY ID ---
document.getElementById("profile-btn").addEventListener("click", () => {
    showModal("Your Profile", "profile", (newName) => {
        if (newName && newName.trim() !== "") {
            updateProfile(currentUser, { displayName: newName }).then(() => {
                update(ref(db, 'users/' + currentUser.uid), { name: newName });
                showToast("Name Updated!");
            });
        }
    });
});

copyUidBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(currentUser.uid).then(() => showToast("ID Copied!"));
});

// --- FRIEND SYSTEM ---
document.getElementById("add-friend-btn").addEventListener("click", () => {
    showModal("Add Friend", "add_friend", (friendUid) => {
        if(friendUid && friendUid.trim() !== "") {
            sendFriendRequest(friendUid.trim());
        }
    });
});

function sendFriendRequest(targetUid) {
    if (targetUid === currentUser.uid) return showToast("Can't add yourself!");
    
    get(ref(db, 'users/' + targetUid)).then((snapshot) => {
        if (snapshot.exists()) {
            set(ref(db, 'friend_requests/' + targetUid + '/' + currentUser.uid), {
                from: currentUser.uid,
                name: currentUser.displayName || currentUser.email,
                email: currentUser.email
            }).then(() => showToast("Request Sent!"));
        } else {
            showToast("User ID Invalid!");
        }
    });
}

function loadFriendRequests() {
    const reqRef = ref(db, 'friend_requests/' + currentUser.uid);
    onValue(reqRef, (snapshot) => {
        requestsList.innerHTML = "";
        const reqs = snapshot.val();
        if (!reqs) {
            requestsList.innerHTML = "<div style='color:#999; font-size:12px;'>No pending requests.</div>";
            return;
        }

        Object.values(reqs).forEach(req => {
            const div = document.createElement("div");
            div.className = "req-card";
            div.innerHTML = `
                <div><strong>${req.name}</strong> wants to connect.</div>
                <div class="req-actions">
                    <button class="req-btn accept-btn">Accept</button>
                    <button class="req-btn reject-btn">Reject</button>
                </div>
            `;
            
            div.querySelector(".accept-btn").addEventListener("click", () => {
                // Add both ways
                update(ref(db, 'friends/' + currentUser.uid + '/' + req.from), { added: true });
                update(ref(db, 'friends/' + req.from + '/' + currentUser.uid), { added: true });
                remove(ref(db, 'friend_requests/' + currentUser.uid + '/' + req.from));
                showToast("Friend Added!");
                loadFriendsList();
            });

            div.querySelector(".reject-btn").addEventListener("click", () => {
                remove(ref(db, 'friend_requests/' + currentUser.uid + '/' + req.from));
                showToast("Rejected");
            });

            requestsList.appendChild(div);
        });
    });
}

// --- MAIN LIST (Global + Friends) ---
function loadFriendsList() {
    const friendsRef = ref(db, 'friends/' + currentUser.uid);
    
    onValue(friendsRef, (snapshot) => {
        usersListEl.innerHTML = "";
        
        // 1. Global Group
        const groupDiv = document.createElement("div");
        groupDiv.className = "user-card";
        groupDiv.innerHTML = `
            <div class="user-avatar group-avatar">🌍</div>
            <div><div class="user-info-name">Global Chat</div><div class="user-info-email">Everyone</div></div>
        `;
        groupDiv.addEventListener("click", () => openChat(null, true));
        usersListEl.appendChild(groupDiv);

        // 2. Friends
        const friends = snapshot.val();
        if (!friends) return;

        Object.keys(friends).forEach(friendUid => {
            get(ref(db, 'users/' + friendUid)).then((userSnap) => {
                const user = userSnap.val();
                if(!user) return;
                const div = document.createElement("div");
                div.className = "user-card";
                div.innerHTML = `
                    <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                    <div><div class="user-info-name">${user.name}</div><div class="user-info-email">${user.email}</div></div>
                `;
                div.addEventListener("click", () => openChat(user, false));
                usersListEl.appendChild(div);
            });
        });
    });
}

// --- CHAT LOGIC ---
function openChat(targetUser, isGroup) {
    if (isGroup) {
        currentChatRoomId = "global_group_chat";
        chatUserName.innerText = "Global Chat";
    } else {
        chatUserName.innerText = targetUser.name;
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
    const name = currentUser.displayName || currentUser.email.split('@')[0];
    push(ref(db, "messages/" + currentChatRoomId), {
        text: text, imageUrl: imageUrl, sender: currentUser.email, senderName: name, timestamp: Date.now()
    });
    msgInput.value = "";
}

function displayMessage(data, key) {
    if (localStorage.getItem("hidden_" + key)) return;

    const div = document.createElement("div");
    div.classList.add("message");
    div.id = key;
    
    const isMe = data.sender === currentUser.email;
    div.classList.add(isMe ? "my-message" : "other-message");

    const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let html = `<span class="sender-name">${data.senderName}</span>`;
    if (data.imageUrl) html += `<img src="${data.imageUrl}" class="msg-img">`;
    if (data.text) html += `<div>${data.text}</div>`;
    html += `<span class="msg-time">${time}</span>`;
    
    div.innerHTML = html;

    div.addEventListener("click", () => {
        if (isMe) {
            showModal("Delete for Everyone?", null, () => {
                remove(ref(db, "messages/" + currentChatRoomId + "/" + key));
                showToast("Deleted");
            });
        } else {
            showModal("Delete for Me?", null, () => {
                localStorage.setItem("hidden_" + key, "true");
                div.remove();
                showToast("Hidden");
            });
        }
    });

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Inputs
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
                           
