// server.js
require('dotenv').config(); // Must be first
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase client (server-side)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Multer setup with file filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only mp3/wav/m4a allowed.'));
  }
});

// Health check
app.get('/', (req, res) => res.send('Server is running'));

// Upload & Transcribe
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

  const audioPath = req.file.path;
  const assemblyKey = process.env.ASSEMBLYAI_API_KEY;

  try {
    // 1️⃣ Upload audio to AssemblyAI
    const audioData = fs.readFileSync(audioPath);
    const uploadRes = await axios.post('https://api.assemblyai.com/v2/upload', audioData, {
      headers: { 
        authorization: assemblyKey, 
        'Content-Type': 'application/octet-stream' 
      }
    });

    const audioUrl = uploadRes.data.upload_url;

    // 2️⃣ Request transcription
    const transcriptRes = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      { audio_url: audioUrl },
      { headers: { authorization: assemblyKey } }
    );

    const transcriptId = transcriptRes.data.id;

    // 3️⃣ Poll until transcription is complete
    let transcriptionText = '';
    let polling = true;
    const maxAttempts = 60; // 3 min max (60 * 3s)
    let attempts = 0;

    while (polling && attempts < maxAttempts) {
      const statusRes = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: assemblyKey }
      });

      const status = statusRes.data.status;

      if (status === 'completed') {
        transcriptionText = statusRes.data.text;
        polling = false;
      } else if (status === 'failed') {
        throw new Error('AssemblyAI transcription failed');
      } else {
        attempts++;
        await new Promise(r => setTimeout(r, 3000)); // wait 3 sec
      }
    }

    if (polling) throw new Error('Transcription timed out');

    // 4️⃣ Save transcription to Supabase
    const { error } = await supabase
      .from('transcriptions')
      .insert([{ filename: req.file.originalname, transcription_text: transcriptionText }]);

    if (error) console.error('Supabase insert error:', error.message);

    // Cleanup
    fs.unlinkSync(audioPath);

    // Respond
    res.json({ success: true, transcription: transcriptionText });

  } catch (err) {
    console.error('Transcription error:', err.message);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    res.status(500).json({ success: false, error: 'Transcription failed', details: err.message });
  }
});

// Get all transcriptions
app.get('/api/transcriptions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    console.error('Fetch transcriptions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch transcriptions' });
  }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
