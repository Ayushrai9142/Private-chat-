import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database-compat.js";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => showChat())
    .catch(alert);
}

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => showChat())
    .catch(alert);
}

function showChat() {
  loginScreen.style.display = "none";
  chatScreen.style.display = "block";
}

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    const msgRef = ref(db, "messages");
    push(msgRef, {
      text: message,
      time: Date.now(),
    });
    messageInput.value = "";
  }
}

onChildAdded(ref(db, "messages"), (snapshot) => {
  const msg = snapshot.val();
  const p = document.createElement("p");
  p.innerText = msg.text;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
});
