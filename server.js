// server/server.js
import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🧩 Supabase client (server role)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🗂 Multer: temporary storage before upload
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({ storage });

// 🧱 Middleware: verify Supabase token
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No auth token" });

  const token = authHeader.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ message: "Invalid token" });

  req.user = data.user;
  next();
}

// 🎙️ Upload route
app.post("/upload", authenticate, upload.single("audio"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileName = req.file.filename;

    // 1️⃣ Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("audio-files")
      .upload(fileName, fs.createReadStream(filePath), {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (storageError) throw storageError;

    // 2️⃣ Get public URL
    const { data: publicURL } = supabase.storage
      .from("audio-files")
      .getPublicUrl(fileName);

    // 3️⃣ Transcribe via OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });

    // 4️⃣ Save metadata in Supabase DB
    const { data, error } = await supabase
      .from("transcriptions")
      .insert([
        {
          user_id: req.user.id,
          filename: req.file.originalname,
          transcription: transcription.text,
          file_url: publicURL.publicUrl,
          created_at: new Date(),
        },
      ]);

    if (error) throw error;

    res.json({
      message: "✅ Transcription successful!",
      text: transcription.text,
      audioURL: publicURL.publicUrl,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Upload/transcription failed", error: err.message });
  }
});

// 📜 History (user-specific)
app.get("/history", authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from("transcriptions")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ message: "History fetch failed" });

  res.json(data);
});

app.get("/", (req, res) => res.send("✅ Speech-to-Text API Running..."));

app.listen(process.env.PORT || 5000, () =>
  console.log(`✅ Server running on port ${process.env.PORT || 5000}`)
);
