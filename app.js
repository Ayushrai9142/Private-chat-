// Show chat screen and hide login after login button click
function login() {
  // You can add real authentication here
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('chat-screen').style.display = 'flex';
}

// Placeholder signup button action
function signup() {
  alert("Sign Up clicked!");
}

// Send message to chat box and clear input
function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  if (message) {
    const chatBox = document.getElementById('chat-box');
    const p = document.createElement('p');
    p.textContent = message;
    chatBox.appendChild(p);
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}
