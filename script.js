const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("chat-screen").style.display = "block";
    })
    .catch(e => alert(e.message));
}

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => login())
    .catch(e => alert(e.message));
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("chat-screen").style.display = "block";
    db.ref("messages").on("child_added", snapshot => {
      const msg = snapshot.val();
      const p = document.createElement("p");
      p.innerText = msg.email + ": " + msg.text;
      document.getElementById("chat-box").appendChild(p);
    });
  }
});

function sendMessage() {
  const input = document.getElementById("message-input");
  const text = input.value.trim();
  if (text !== "") {
    db.ref("messages").push({
      email: auth.currentUser.email,
      text: text
    });
    input.value = "";
  }
}
