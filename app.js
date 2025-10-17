function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  if (message) {
    const chatBox = document.getElementById('chat-box');

    // Append user's message
    const userMsg = document.createElement('p');
    userMsg.textContent = message;
    userMsg.style.backgroundColor = '#dcf8c6';  // User message color
    chatBox.appendChild(userMsg);

    // Append automated English reply
    const replyMsg = document.createElement('p');
    replyMsg.textContent = "Please login to continue chatting.";
    replyMsg.style.backgroundColor = '#f0f0f0';  // Different color for reply
    replyMsg.style.color = '#555';
    replyMsg.style.fontStyle = 'italic';
    chatBox.appendChild(replyMsg);

    // Clear input and scroll chat down
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}
