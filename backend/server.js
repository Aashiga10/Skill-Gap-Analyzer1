
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
import youtubeSearch from "./routes/youtubeSearch.js";
import voiceAuth from "./routes/voiceAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();

app.use(cors());
app.use(express.json());

// Serve the frontend (single origin so the app's relative /api calls work)
app.use(express.static(path.join(__dirname, "../frontend")));

// Resume Upload Route
app.use("/uploadResume", uploadResume);

// YouTube Search Route (SerpApi)
app.use("/api/youtube", youtubeSearch);

// Locked Voice Biometric Auth Route
app.use("/api/voice-auth", voiceAuth);

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

    const systemPrompt = "You are SkillNexus AI, an intelligent career and skill gap advisor. You must respond strictly and exclusively in the English language only at all times. Keep responses concise, conversational, and direct (2-3 sentences max unless details are requested) so they can be comfortably spoken aloud. Avoid markdown formatting like asterisks or hashtags.";

    // 1. Primary: Ollama
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.1:8b";
    try {
      const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          stream: false,
          options: { temperature: 0.6 }
        }),
        signal: AbortSignal.timeout(2200)
      });
      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        const reply = data.message?.content;
        if (reply) {
          return res.json({ response: reply, provider: "ollama", model: ollamaModel });
        }
      }
    } catch (e) {}

    // 2. Ultra-Fast Cloud Fallback: Groq LLM (200ms)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 250
          }),
          signal: AbortSignal.timeout(3000)
        });
        if (groqRes.ok) {
          const data = await groqRes.json();
          const reply = data.choices && data.choices[0] ? data.choices[0].message.content : null;
          if (reply) {
            return res.json({ response: reply, provider: "groq", model: "openai/gpt-oss-20b" });
          }
        }
      } catch (e) {}
    }

    // 3. Fallback: OpenRouter (Free Cloud)
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openrouterModel = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
    if (openrouterKey) {
      try {
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterKey}`,
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "SkillNexus AI Voice"
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 250
          }),
          signal: AbortSignal.timeout(6000)
        });
        if (orRes.ok) {
          const data = await orRes.json();
          const reply = data.choices && data.choices[0] ? data.choices[0].message.content : null;
          if (reply) {
            return res.json({ response: reply, provider: "openrouter", model: openrouterModel });
          }
        }
      } catch (e) {}
    }

    // 3. Optional: NVIDIA NIM
    const nvidiaKey = process.env.NVIDIA_LLM_API_KEY;
    if (nvidiaKey) {
      try {
        const primaryModel = process.env.NVIDIA_LLM_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b";
        const nvRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${nvidiaKey}`
          },
          body: JSON.stringify({
            model: primaryModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 250
          }),
          signal: AbortSignal.timeout(5000)
        });
        if (nvRes.ok) {
          const data = await nvRes.json();
          const reply = data.choices && data.choices[0] ? data.choices[0].message.content : null;
          if (reply) {
            return res.json({ response: reply, provider: "nvidia", model: primaryModel });
          }
        }
      } catch (e) {}
    }

    // 4. Local Rule-based conversational fallback
    res.json({
      response: "I'm here to help guide your career path and skill analysis. You can ask me to analyze your skills, view roadmaps, or explore recommended courses.",
      provider: "local_rules"
    });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Voice assistant failed to process prompt." });
  }
});

// Helper for deterministic fallback intent when LLM is unavailable or offline
function getLocalFallbackIntent(speech, currentPage) {
  const t = (speech || "").toLowerCase().trim();

  // Navigation
  if (t.includes("go to login") || t === "login" || t.includes("sign in") || t.includes("log in")) {
    return {
      intent: "LOGIN",
      action: "login",
      arguments: {},
      spokenResponse: "Opening login. Please say your email address.",
      requiresConfirmation: false
    };
  }
  const isNav = /^(go to|open|navigate to|show|view|switch to|take me to)\s+/i.test(t);

  if (isNav || t === "go home" || t === "go to dashboard") {
    if (t.includes("dashboard") || t.includes("analysis") || t.includes("home")) {
      return {
        intent: "NAVIGATE",
        action: "navigate",
        arguments: { page: "analyse" },
        spokenResponse: "Navigating to the Skill Analysis dashboard.",
        requiresConfirmation: false
      };
    }
    if (t.includes("results")) {
      return {
        intent: "NAVIGATE",
        action: "navigate",
        arguments: { page: "results" },
        spokenResponse: "Navigating to your analysis results.",
        requiresConfirmation: false
      };
    }
    if (t.includes("roadmap")) {
      return {
        intent: "NAVIGATE",
        action: "navigate",
        arguments: { page: "roadmap" },
        spokenResponse: "Navigating to your learning roadmap.",
        requiresConfirmation: false
      };
    }
    if (t.includes("courses")) {
      return {
        intent: "NAVIGATE",
        action: "navigate",
        arguments: { page: "courses" },
        spokenResponse: "Navigating to recommended courses.",
        requiresConfirmation: false
      };
    }
    if (t.includes("progress")) {
      return {
        intent: "NAVIGATE",
        action: "navigate",
        arguments: { page: "progress" },
        spokenResponse: "Navigating to your progress tracker.",
        requiresConfirmation: false
      };
    }
    if (t.includes("profile")) {
      return {
        intent: "NAVIGATE",
        action: "navigate",
        arguments: { page: "profile" },
        spokenResponse: "Navigating to your profile.",
        requiresConfirmation: false
      };
    }
    if (t.includes("login") || t.includes("sign in")) {
      return {
        intent: "LOGIN",
        action: "login",
        arguments: {},
        spokenResponse: "Opening login screen.",
        requiresConfirmation: false
      };
    }
  }

  if (t.includes("logout") || t.includes("sign out") || t.includes("log out")) {
    return {
      intent: "LOGOUT",
      action: "logout",
      arguments: {},
      spokenResponse: "Logging you out. Returning to the home screen.",
      requiresConfirmation: false
    };
  }
  if (t.includes("read this page") || t.includes("read page") || t.includes("what is on this page")) {
    return {
      intent: "READ_PAGE",
      action: "read_page",
      arguments: {},
      spokenResponse: "Scanning and reading the current page.",
      requiresConfirmation: false
    };
  }
  if (t === "submit" || t === "analyze my skills" || t === "run analysis" || t === "submit analysis") {
    return {
      intent: "SUBMIT",
      action: "submit_form",
      arguments: { form: "analyse" },
      spokenResponse: "Submitting your skill gap analysis.",
      requiresConfirmation: true
    };
  }

  // Explicit Dream Job Setting ONLY (never on ambient speech)
  const jobMatch = (speech || "").match(/^(?:set my dream job to|my dream job is|set dream job to)\s+([a-zA-Z\s\/]+?)(?:\s+and|\s+with|$)/i);
  if (jobMatch) {
    return {
      intent: "FILL_FIELD",
      action: "fill_field",
      arguments: { field: "dreamJob", value: jobMatch[1].trim() },
      spokenResponse: `Setting your dream job to ${jobMatch[1].trim()}.`,
      requiresConfirmation: false
    };
  }

  // Hours extraction
  const hourMatch = t.match(/(\d+)\s*(?:hours|hrs)/i);
  if (hourMatch) {
    return {
      intent: "FILL_FIELD",
      action: "set_hours",
      arguments: { hours: parseInt(hourMatch[1]) },
      spokenResponse: `Setting available time to ${hourMatch[1]} hours per week.`,
      requiresConfirmation: false
    };
  }

  // Skills extraction
  const skillMatch = (speech || "").match(/(?:skills (?:are|as)|skills of|know)\s+([a-zA-Z0-9,\s]+)/i);
  if (skillMatch) {
    return {
      intent: "FILL_FIELD",
      action: "fill_field",
      arguments: { field: "skills", value: skillMatch[1].trim() },
      spokenResponse: `Adding your skills: ${skillMatch[1].trim()}.`,
      requiresConfirmation: false
    };
  }

  return {
    intent: "CONVERSATION",
    action: "none",
    arguments: {},
    spokenResponse: "I heard you. You can ask me to navigate, fill your career goals, read the page, or log in.",
    requiresConfirmation: false
  };
}

// ── LLM VOICE INTENT REASONING ENDPOINT ─────────────
app.post("/api/voice/intent", async (req, res) => {
  try {
    let { speech, currentPage, pageContext, sessionContext } = req.body;
    if (!speech || typeof speech !== "string") {
      return res.status(400).json({ error: "User speech is required" });
    }

    // 1. Security check: NEVER process, accept, or log passwords
    delete req.body.password;
    delete req.body.pass;
    if (pageContext && pageContext.elements) {
      pageContext.elements = pageContext.elements.filter(el => el.type !== "password");
    }

    const systemPrompt = `You are the conversation engine for the SkillNexus AI platform (Skill Gap Analyzer).
You must respond strictly and exclusively in the English language only at all times.
Your task is to analyze user speech in the context of the current web page, determine their intent, decide what safe website action/tool to invoke, and generate a concise, natural, polite spoken response (1-2 sentences maximum, comfortable to speak aloud, no markdown, no asterisks).

STRICT SAFETY AND PERMISSION RULES:
1. NEVER trigger "navigate" or "login" unless the user explicitly and directly commands navigation (e.g. "go to dashboard", "go to login", "navigate to roadmap"). If the user asks a question, makes ambient remarks, or is conversational, use action "none".
2. NEVER trigger "fill_field", "add_skill", or "set_hours" unless the user explicitly states what value to set (e.g. "set my dream job to...", "my skills are...").
3. NEVER assume or hallucinate user intent. When in doubt, reply conversationally with action "none".

Available website tools/actions:
- "navigate": Navigate to a screen or page. Valid pages: "landing", "login", "signup", "about", "analyse", "results", "roadmap", "courses", "progress", "profile". Arguments: { "page": string }.
- "fill_field": Fill form inputs. Arguments: { "field": "job"|"dreamJob"|"skills"|"hours"|"email", "value": string|number }.
- "add_skill": Add a skill tag. Arguments: { "skill": string }.
- "set_hours": Set available learning hours per week. Arguments: { "hours": number }.
- "submit_form": Submit current form or analysis. Arguments: { "form": "login"|"analyse"|"signup" }.
- "read_page": Read summary of the current page aloud. Arguments: {}.
- "get_dashboard_data": Read match score or specific stats. Arguments: {}.
- "login": Start or progress conversational login. Arguments: { "email": string (optional) }.
- "google_login": Click Google login button to sign in with Google. Arguments: {}.
- "logout": Log out user and return to home screen. Arguments: {}.
- "ask_user": Ask the user a clarifying question when information is missing. Arguments: { "question": string }.
- "cancel": Cancel current task. Arguments: {}.
- "none": No DOM action needed, purely conversational reply. Arguments: {}.

IMPORTANT SECURITY RULE: NEVER ask for, process, or output passwords or credentials. Password entry is handled locally by the client application.

Output ONLY a valid, single JSON object without backticks or markdown:
{
  "intent": "NAVIGATE | FILL_FIELD | SUBMIT | READ_PAGE | LOGIN | GOOGLE_LOGIN | LOGOUT | ASK_USER | CANCEL | CONVERSATION | UNKNOWN",
  "action": "navigate | fill_field | add_skill | set_hours | submit_form | read_page | get_dashboard_data | login | google_login | logout | ask_user | cancel | none",
  "arguments": {},
  "spokenResponse": "Concise spoken reply for user",
  "requiresConfirmation": boolean
}`;

    const userPrompt = JSON.stringify({
      userSpeech: speech.trim(),
      currentPage: currentPage || "landing",
      pageContext: pageContext || {},
      sessionContext: sessionContext || {}
    });

    const parseJsonResponse = (content) => {
      if (!content) return null;
      let text = content.trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
      }
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.intent && parsed.action) return parsed;
        } catch (e) {}
      }
      try {
        const parsed = JSON.parse(text);
        if (parsed.intent && parsed.action) return parsed;
      } catch (e) {}
      return null;
    };

    // ── 1. PRIMARY: OLLAMA (Local AI Inference) ──────
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.1:8b";
    try {
      const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          format: "json",
          stream: false,
          options: { temperature: 0.2 }
        }),
        signal: AbortSignal.timeout(2200)
      });

      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json();
        const content = ollamaData.message?.content || "";
        const parsed = parseJsonResponse(content);
        if (parsed) {
          return res.json({ ...parsed, provider: "ollama", model: ollamaModel });
        }
      }
    } catch (ollamaErr) {
      // Ollama offline or timed out -> proceed to fallback
    }

    // ── 2. ULTRA-FAST CLOUD: GROQ LLM (200ms) ────────
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.1,
            max_tokens: 300
          }),
          signal: AbortSignal.timeout(3000)
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices && groqData.choices[0] ? groqData.choices[0].message.content : "";
          const parsed = parseJsonResponse(content);
          if (parsed) {
            return res.json({ ...parsed, provider: "groq", model: "openai/gpt-oss-20b" });
          }
        }
      } catch (groqErr) {}
    }

    // ── 3. FALLBACK: OPENROUTER (Free Cloud AI) ─────
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openrouterModel = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

    if (openrouterKey) {
      try {
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterKey}`,
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "SkillNexus AI Voice"
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 300
          }),
          signal: AbortSignal.timeout(6000)
        });

        if (orRes.ok) {
          const orData = await orRes.json();
          const content = orData.choices && orData.choices[0] ? orData.choices[0].message.content : "";
          const parsed = parseJsonResponse(content);
          if (parsed) {
            return res.json({ ...parsed, provider: "openrouter", model: openrouterModel });
          }
        }
      } catch (orErr) {
        console.warn("OpenRouter fallback attempt failed:", orErr.message);
      }
    }

    // ── 3. OPTIONAL BACKUP: NVIDIA NIM ──────────────
    const nvidiaKey = process.env.NVIDIA_LLM_API_KEY;
    if (nvidiaKey) {
      try {
        const nvidiaModel = process.env.NVIDIA_LLM_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b";
        const nvRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${nvidiaKey}`
          },
          body: JSON.stringify({
            model: nvidiaModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 300
          }),
          signal: AbortSignal.timeout(5000)
        });

        if (nvRes.ok) {
          const nvData = await nvRes.json();
          const content = nvData.choices && nvData.choices[0] ? nvData.choices[0].message.content : "";
          const parsed = parseJsonResponse(content);
          if (parsed) {
            return res.json({ ...parsed, provider: "nvidia", model: nvidiaModel });
          }
        }
      } catch (nvErr) {}
    }

    // ── 4. DETERMINISTIC LOCAL FALLBACK ──────────────
    const fallbackIntent = getLocalFallbackIntent(speech, currentPage);
    return res.json({ ...fallbackIntent, provider: "local_rules" });
  } catch (error) {
    console.error("Voice intent error:", error);
    const fallback = getLocalFallbackIntent(req.body?.speech || "", req.body?.currentPage || "landing");
    return res.json({ ...fallback, provider: "local_rules" });
  }
});

// ── TTS ENDPOINT (Browser Native Fallback) ─────────
app.get("/api/voicebox/status", (req, res) => {
  res.json({ status: "disabled", message: "Using native browser speech synthesis." });
});

app.post("/api/tts", (req, res) => {
  res.json({ fallbackToBrowser: true });
});

// STT Endpoint
import multer from 'multer';
import fs from 'fs';
const uploadAudio = multer({ dest: 'uploads/' });

app.post("/api/stt", uploadAudio.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Audio file is required" });

    const fileBuffer = fs.readFileSync(req.file.path);
    const fileBlob = new Blob([fileBuffer], { type: req.file.mimetype || 'audio/webm' });

    const formData = new FormData();
    formData.append("file", fileBlob, req.file.originalname || 'audio.webm');
    formData.append("model", "whisper-large-v3"); 
    formData.append("language", "en"); 

    const sttUrl = "https://api.groq.com/openai/v1/audio/transcriptions";
    const groqApiKey = process.env.GROQ_API_KEY;
    const response = await fetch(sttUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 400 && errorText.includes("invalid_media_file")) {
        // Silent or tiny audio packet without data, resolve gracefully with empty text
        return res.json({ text: "" });
      }
      throw new Error(`Groq STT Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    res.json({ text: data.text || "" });
  } catch (error) {
    console.error("STT Error:", error.message);
    res.json({ text: "", error: error.message });
  } finally {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
});

// Ollama Name Extraction Endpoint
app.post("/api/ollama/extract-name", express.json(), async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: "Transcript required" });
    
    const prompt = `Extract the person's name from this text: "${transcript}". Reply ONLY with the name, nothing else. If no name is found, reply with "UNKNOWN".`;
    
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3", prompt, stream: false })
    });
    
    if (!ollamaRes.ok) throw new Error("Ollama request failed");
    
    const data = await ollamaRes.json();
    let name = data.response.trim();
    if (name === "UNKNOWN" || name === "") {
       name = transcript.replace(/^(my\s+name\s+is|i\s+am|i'm|this\s+is)\s+/i, '').trim();
       if (!name) name = "Student";
    }
    res.json({ name });
  } catch (error) {
    console.error("Ollama Error:", error);
    // Fallback to basic regex
    let name = (req.body?.transcript || "").replace(/^(my\s+name\s+is|i\s+am|i'm|this\s+is)\s+/i, '').trim();
    res.json({ name: name || "Student" });
  }
});

// Voice Biometric Enrollment Endpoint
app.post("/api/enroll", uploadAudio.single('audio'), async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !req.file) return res.status(400).json({ error: "Name and audio required" });

    // Read audio as base64 to save in JSON
    const audioBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });
    fs.unlinkSync(req.file.path);

    const usersFile = 'users.json';
    let users = [];
    if (fs.existsSync(usersFile)) {
      users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      voiceprint: audioBase64,
      joined: new Date().toLocaleDateString()
    };

    users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    res.json({ success: true, user: { name, email } });
  } catch (error) {
    console.error("Enrollment Error:", error);
    res.status(500).json({ error: "Failed to enroll user." });
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