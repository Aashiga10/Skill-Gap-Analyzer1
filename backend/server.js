
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
import db from "./database/firebaseAdmin.js";
import uploadResume from "./routes/uploadResume.js";

dotenv.config();

const app = express();

app.use(cors());  
app.use(express.json());

// Resume Upload Route
app.use("/uploadResume", uploadResume);

app.get("/", (req, res) => {
  res.send("Home Page");
});

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

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NVIDIA_LLM_API_KEY || process.env.NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-4-340b-instruct",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices && data.choices[0] ? data.choices[0].message.content : "No response";
    res.json({ response: reply });
  } catch (error) {
    console.error("NVIDIA Chat Error:", error);
    res.status(500).json({ error: "Voice assistant failed to process prompt." });
  }
});

// TTS Endpoint
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const response = await fetch("https://integrate.api.nvidia.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NVIDIA_TTS_API_KEY || process.env.NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: "chatterbot", // User requested 'chatterbot'
        input: text,
        voice: "alloy"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA TTS Error: ${response.status} ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set("Content-Type", "audio/mpeg");
    res.send(buffer);
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
        "Authorization": `Bearer ${process.env.NVIDIA_STT_API_KEY || process.env.NVIDIA_API_KEY}`,
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