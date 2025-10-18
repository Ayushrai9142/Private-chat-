function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();

  if (message) {
    const chatBox = document.getElementById('chat-box');

    // User message (right aligned)
    const userMsg = document.createElement('p');
    userMsg.textContent = message;
    userMsg.classList.add('user-message');
    chatBox.appendChild(userMsg);

    // Typing indicator (left aligned)
    const typing = document.createElement('p');
    typing.textContent = 'typing...';
    typing.classList.add('typing-message');
    chatBox.appendChild(typing);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
    input.value = '';

    // After 2 seconds, remove typing and show reply
    setTimeout(() => {
      typing.remove();
      const replyMsg = document.createElement('p');
      replyMsg.textContent = 'Please login to continue chatting.';
      replyMsg.classList.add('bot-message');
      chatBox.appendChild(replyMsg);
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 2000);
  }
}
