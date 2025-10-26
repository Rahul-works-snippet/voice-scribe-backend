# 🎙️ VoiceScribe – Speech-to-Text Web App

**VoiceScribe** is a full-stack web application that converts spoken audio into text using the MERN stack, Tailwind CSS, and Speech-to-Text APIs. Users can upload or record audio, see live transcriptions, and view their transcription history.

---

## 🧰 Tech Stack

- **Frontend:** React.js (Vite) + Tailwind CSS  
- **Backend:** Node.js + Express.js  
- **Database:** Supabase (PostgreSQL)  
- **Speech-to-Text API:** AssemblyAI / OpenAI Whisper (configurable)  
- **Deployment:** Netlify (frontend) + Render (backend)  

---

## 🚀 Features

- Upload audio files (.mp3, .wav, .m4a) and get transcriptions instantly  
- Live audio recording using MediaRecorder API  
- View previous transcription history per user  
- Authentication using Supabase Auth (signup, login, logout)  
- Responsive, modern UI with gradient background and hover effects  

---

## 📂 Project Structure

**Frontend (React + Tailwind)**

lient/
│
├── src/
│ ├── App.jsx
│ ├── main.jsx
│ ├── index.css
│ └── components/
│ ├── Auth.jsx
│ └── Transcriber.jsx
├── package.json
└── vite.config.js


**Backend (Node.js + Express)**

erver/
│
├── server.js
├── package.json
├── .gitignore
└── routes/
└── upload.js


---

## ⚙️ Setup & Installation

### Backend

```bash
cd server
npm install
# Create .env file
# Add keys:
# SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...
# ASSEMBLYAI_API_KEY=...
# PORT=5000
npm start

**Frontend**

cd client
npm install
# Create .env file
# Add keys:
# VITE_BACKEND_URL=https://your-backend-url/api
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
npm run dev


🌐 Deployment

Backend: Render

Frontend: Netlify

Ensure .env files are configured with API keys and URLs.

Update frontend VITE_BACKEND_URL to point to the deployed backend.

📸 Screenshots

![VoiceScribe Frontend](public/images/frontend-screenshot.png)




🔗 Usage

Sign up or log in (if authentication enabled)

Upload an audio file or record live audio

Wait for transcription to appear

View previous transcriptions in the history section

⚠️ Notes

Only audio files (.mp3, .wav, .m4a) are supported

Ensure backend is running and .env variables are correctly set

For production, replace local URLs with deployed URLs

📘 Author

Rahul – Intern / Developer

GitHub: https://github.com/Rahul-works-snippet
