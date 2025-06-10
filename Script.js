// 1. Your Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const messagesDiv = document.getElementById('messages');

// 2. Login
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => showChat())
    .catch(e => alert(e.message));
}

// 3. Signup
function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => showChat())
    .catch(e => alert(e.message));
}

// 4. Logout
function logout() {
  auth.signOut();
  loginSection.style.display = 'block';
  chatSection.style.display = 'none';
}

// 5. Show Chat after login
function showChat() {
  loginSection.style.display = 'none';
  chatSection.style.display = 'block';

  // Load Messages Real-Time
  db.collection('messages').orderBy('timestamp')
    .onSnapshot(snapshot => {
      messagesDiv.innerHTML = '';
      snapshot.forEach(doc => {
        const msg = doc.data();
        messagesDiv.innerHTML += `<div><b>${msg.user}:</b> ${msg.text}</div>`;
      });
    });
}

// 6. Send Message
function sendMessage() {
  const text = document.getElementById('message').value;
  db.collection('messages').add({
    text: text,
    user: auth.currentUser.email,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById('message').value = '';
}

// 7. Auto-login Check
auth.onAuthStateChanged(user => {
  if (user) showChat();
});
