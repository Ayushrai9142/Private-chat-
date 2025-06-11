// Your Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentUserEmail = "";

// Login function
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      currentUserEmail = email;
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("chat-screen").style.display = "block";
      listenForMessages();
    })
    .catch(error => {
      alert("Login Failed: " + error.message);
    });
}

// Signup function
function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Signup Successful! Now login.");
    })
    .catch(error => {
      alert("Signup Failed: " + error.message);
    });
}

// Send message
function sendMessage() {
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();

  if (message === "") return;

  const timestamp = Date.now();

  db.ref("messages").push({
    user: currentUserEmail,
    message: message,
    time: timestamp
  });

  messageInput.value = "";
}

// Display messages
function listenForMessages() {
  const chatBox = document.getElementById("chat-box");

  db.ref("messages").on("child_added", snapshot => {
    const data = snapshot.val();
    const messageElement = document.createElement("p");

    if (data.user === currentUserEmail) {
      messageElement.style.background = "#dcf8c6";
      messageElement.style.alignSelf = "flex-end";
    } else {
      messageElement.style.background = "#ffffff";
      messageElement.style.alignSelf = "flex-start";
    }

    messageElement.textContent = `${data.user.split('@')[0]}: ${data.message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}
