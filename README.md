# 🔒 Private Chat App (Secure & Real-Time)

A secure, real-time messaging web application built with **Vanilla JavaScript** and **Firebase**. 
It features a beautiful **Milky White Glassmorphism UI** and focuses on privacy by using unique User IDs instead of phone numbers.

## 🚀 Features

- **🌍 Global Group Chat:** Talk with everyone in the main lounge.
- **🛡️ Private 1-on-1 Chat:** Secure messaging via Friend Request system.
- **🆔 Unique ID System:** Add friends using unique UIDs (No phone numbers required).
- **📷 Media Sharing:** Send images up to 100KB.
- **🗑️ Advanced Delete:** - *Delete for Everyone* (Your messages).
  - *Delete for Me* (Others' messages).
- **🎨 Glassmorphism Design:** Modern, clean, and responsive UI.
- **📱 PWA Support:** Installable on Android/iOS as a native app.
- **🔒 Secure:** Firebase Authentication & Realtime Database Rules.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend:** Firebase (Authentication, Realtime Database)
- **Deployment:** GitHub Pages / Firebase Hosting

## 📖 How to Use

1. **Sign Up/Login:** Create an account using Email & Password.
2. **Global Chat:** By default, you join the Global Chat.
3. **Add a Friend:**
   - Go to **Profile** → Click **Copy ID**.
   - Share this ID with your friend.
   - Your friend clicks **"➕ Add"** → Pastes ID → Sends Request.
   - You accept the request in the **Add** menu.
4. **Start Chatting:** Click on the friend's name to start a private conversation.

## ⚙️ Setup (For Developers)

If you want to run this locally:

1. Clone the repository.
2. Create a project on [Firebase Console](https://console.firebase.google.com/).
3. Enable **Authentication** (Email/Password) and **Realtime Database**.
4. Copy your Firebase Config keys and replace them in `script.js`.
5. Set Database Rules to `auth != null`.
6. Open `index.html` in your browser!

---

**Made with ❤️ by Ayush**
