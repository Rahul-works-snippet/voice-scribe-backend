// routes/transcribe.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");
require("dotenv").config();

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const file = fs.createReadStream(req.file.path);

    const response = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      transcription: response.text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Transcription error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: "Transcription failed" });
  }
});

module.exports = router;
