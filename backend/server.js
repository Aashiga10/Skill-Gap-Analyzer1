
// // newly added

// app.get("/add-user", async (req, res) => {
//   try {
//     const docRef = await addDoc(collection(db, "users"), {
//       name: "Aashiga",
//       skill: "Java"
//     });

//     res.send(`User added with ID: ${docRef.id}`);
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });

// app.get("/test-firebase", (req, res) => {
//   res.send("Firebase Connected");
// });

// app.get("/add-user", async (req, res) => {
//   res.send("Testing");
// });


// working code

// import express from "express";

// const app = express();

// app.get("/", (req, res) => {
//   res.send("Home Page");
// });

// app.get("/add-user", (req, res) => {
//   res.send("Add User Route Working");
// });

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });



// before code



// import express from "express";
// import db from "./database/firebaseAdmin.js";

// const app = express();

// app.get("/", (req, res) => {
//   res.send("Home Page");
// });
// app.get("/add-user", async (req, res) => {
//   try {
//     const docRef = await db.collection("users").add({
//       name: "Aashiga",
//       email: "aashiga@gmail.com",
//       dreamJob: "Java Developer",
//       completedCourses: []
//     });

//     res.send(`User added with ID: ${docRef.id}`);
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });
// // app.get("/add-user", async (req, res) => {
// //   try {
// //     const docRef = await db.collection("users").add({
// //       name: "Aashiga",
// //       skill: "Java"
// //     });

// //     res.send(`User added with ID: ${docRef.id}`);
// //   } catch (error) {
// //     res.status(500).send(error.message);
// //   }
// // });

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });

// import uploadResume from "./routes/uploadResume.js";

// app.use("/uploadResume",uploadResume);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import path from "path";
import db from "./database/firebaseAdmin.js";
import uploadResume from "./routes/uploadResume.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve the frontend (single origin so the app's relative /api calls work)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "../frontend")));

// Resume Upload Route
app.use("/uploadResume", uploadResume);

app.get("/add-user", async (req, res) => {
  try {
    const docRef = await db.collection("users").add({
      name: "Aashiga",
      email: "aashiga@gmail.com",
      dreamJob: "Java Developer",
      completedCourses: []
    });

    res.send(`User added with ID: ${docRef.id}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const primaryModel = req.body.model || process.env.NVIDIA_LLM_MODEL || "nvidia/nemotron-3-ultra-550b-a55b";
    const fallbackModel = "nvidia/nemotron-3.5-lightning-30b-a3b";
    const apiKey = process.env.NVIDIA_LLM_API_KEY;

    const systemMessage = {
      role: "system",
      content: "You are SkillSync AI, an intelligent career and skill gap advisor. Keep responses concise, conversational, and direct (2-3 sentences max unless details are requested) so they can be comfortably spoken aloud. Avoid markdown formatting like asterisks or hashtags."
    };

    const callModel = async (modelName) => {
      return await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            systemMessage,
            { role: "user", content: prompt }
          ],
          temperature: 0.6,
          max_tokens: 250
        })
      });
    };

    let response = await callModel(primaryModel);

    // If primary model is overloaded (e.g. 503 on 550B NIM) or fails, seamlessly fall back to lightning
    if (!response.ok && primaryModel !== fallbackModel) {
      console.warn(`Primary model ${primaryModel} returned status ${response.status}. Automatically falling back to ${fallbackModel}...`);
      response = await callModel(fallbackModel);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices && data.choices[0] ? data.choices[0].message.content : "No response";
    res.json({ response: reply, model: data.model || primaryModel });
  } catch (error) {
    console.error("NVIDIA Chat Error:", error);
    res.status(500).json({ error: "Voice assistant failed to process prompt." });
  }
});

// ── VOICEBOX & TTS ENDPOINTS ───────────────────────
const VOICEBOX_URL = process.env.VOICEBOX_API_URL || "http://127.0.0.1:17493";

// Check if Voicebox is running locally
app.get("/api/voicebox/status", async (req, res) => {
  try {
    const r = await fetch(`${VOICEBOX_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) {
      const data = await r.json();

      // Also check active tasks / downloads
      let tasks = null;
      try {
        const taskRes = await fetch(`${VOICEBOX_URL}/tasks/active`, { signal: AbortSignal.timeout(2000) });
        if (taskRes.ok) tasks = await taskRes.json();
      } catch (te) { }

      // Also get profiles count
      let profiles = [];
      try {
        const profRes = await fetch(`${VOICEBOX_URL}/profiles`, { signal: AbortSignal.timeout(2000) });
        if (profRes.ok) profiles = await profRes.json();
      } catch (pe) { }

      return res.json({
        status: "connected",
        url: VOICEBOX_URL,
        health: data,
        tasks,
        profiles
      });
    }
  } catch (e) { }
  res.json({
    status: "offline",
    url: VOICEBOX_URL,
    message: `Voicebox is not reachable on ${VOICEBOX_URL}. Ensure Voicebox is running.`
  });
});

// List available voice profiles from Voicebox
app.get("/api/voicebox/profiles", async (req, res) => {
  try {
    const r = await fetch(`${VOICEBOX_URL}/profiles`, { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      const data = await r.json();
      return res.json({ profiles: data });
    }
  } catch (e) { }
  res.status(503).json({ error: `Voicebox server unreachable at ${VOICEBOX_URL}. Please launch the Voicebox app.` });
});

// Generate speech using Voicebox
app.post("/api/tts", async (req, res) => {
  try {
    let { text, profile_id } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    // If no profile_id passed, check if a profile exists (e.g. Aashiga's cloned voice)
    if (!profile_id) {
      try {
        const profRes = await fetch(`${VOICEBOX_URL}/profiles`, { signal: AbortSignal.timeout(2000) });
        if (profRes.ok) {
          const profiles = await profRes.json();
          if (Array.isArray(profiles) && profiles.length > 0) {
            profile_id = profiles[0].id;
          }
        }
      } catch (pe) { }
    }

    // Attempt 1: Streaming endpoint (direct audio/wav output)
    try {
      const streamRes = await fetch(`${VOICEBOX_URL}/generate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          profile_id: profile_id || undefined
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (streamRes.ok) {
        const contentType = streamRes.headers.get("content-type") || "audio/wav";
        if (contentType.includes("audio") || contentType.includes("octet-stream") || contentType.includes("wav")) {
          const arrayBuffer = await streamRes.arrayBuffer();
          res.set("Content-Type", "audio/wav");
          return res.send(Buffer.from(arrayBuffer));
        }
      } else {
        const err = await streamRes.text();
        console.warn("Voicebox stream returned status:", streamRes.status, err);
      }
    } catch (vbErr) {
      console.log("Voicebox streaming attempt failed:", vbErr.message);
    }

    // Attempt 2: Standard generate endpoint + audio download
    try {
      const voiceboxRes = await fetch(`${VOICEBOX_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          profile_id: profile_id || undefined
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (voiceboxRes.ok) {
        const genData = await voiceboxRes.json();
        if (genData.id) {
          const audioRes = await fetch(`${VOICEBOX_URL}/audio/${genData.id}`, { signal: AbortSignal.timeout(15000) });
          if (audioRes.ok) {
            const arrayBuffer = await audioRes.arrayBuffer();
            res.set("Content-Type", audioRes.headers.get("content-type") || "audio/wav");
            return res.send(Buffer.from(arrayBuffer));
          }
        }
      }
    } catch (genErr) {
      console.log("Voicebox generation attempt failed:", genErr.message);
    }

    // Fallback response if Voicebox is not active or model not ready
    res.status(503).json({
      error: "Voicebox is offline or model is downloading",
      fallbackToBrowser: true,
      message: "Voicebox model is not ready or server is offline. The app will use native browser speech synthesis."
    });
  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).json({ error: "Failed to generate speech." });
  }
});

// STT Endpoint
import multer from 'multer';
import FormData from 'form-data';
import fs from 'fs';
const uploadAudio = multer({ dest: 'uploads/' });

app.post("/api/stt", uploadAudio.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Audio file is required" });

    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));
    formData.append("model", "whisper"); // User requested 'whisper'

    const response = await fetch("https://integrate.api.nvidia.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_STT_API_KEY || process.env.NVIDIA_LLM_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA STT Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    res.json({ text: data.text });
  } catch (error) {
    console.error("STT Error:", error);
    res.status(500).json({ error: "Failed to transcribe audio." });
  }
});

// Send Course Completion Email Route
app.post("/api/send-completion-email", async (req, res) => {
  try {
    const { email, userName, courseName } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Use a dummy transport if real credentials are not provided
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER || "dummy_user",
        pass: process.env.SMTP_PASS || "dummy_pass",
      },
    });

    const info = await transporter.sendMail({
      from: '"SkillNexus AI" <noreply@skillnexus.ai>',
      to: email,
      subject: "Course Completed! 🎉",
      text: `Hello ${userName},\n\nCongratulations on completing the course: "${courseName}".\n\nYour progress has been updated on your SkillNexus AI dashboard.\n\nKeep up the great work!`,
      html: `<h3>Hello ${userName},</h3><p>Congratulations on completing the course: <strong>"${courseName}"</strong>.</p><p>Your progress has been updated on your SkillNexus AI dashboard.</p><p>Keep up the great work!</p>`,
    });

    console.log("Completion email sent: %s", info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Email Sending Error:", error);
    res.status(500).json({ error: "Failed to send email." });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});