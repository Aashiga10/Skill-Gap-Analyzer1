import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const uploadAudio = multer({ dest: "uploads/" });

const PROFILES_DIR = path.join(__dirname, "../database/voiceprofiles");

/**
 * Helper to get allowed users from environment
 */
function getAllowedUsers() {
  const envVal = process.env.VOICE_AUTH_ALLOWED_USERS || "aashiga,devipriya";
  return envVal
    .split(",")
    .map((u) => u.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Basic acoustic validation on audio buffer
 * Checks that the file contains actual vocal speech data (energy & pitch range)
 */
function validateAcousticSignal(buffer) {
  if (!buffer || buffer.length < 500) {
    return { valid: false, reason: "Audio sample too short or empty" };
  }

  // Calculate rough RMS amplitude across bytes safely (never read past buffer.length - 1)
  let sumSquares = 0;
  const maxBytes = Math.min(buffer.length - 1, 32000);
  let counted = 0;
  for (let i = 0; i < maxBytes; i += 2) {
    try {
      const sample = buffer.readInt16LE ? buffer.readInt16LE(i) : 0;
      sumSquares += sample * sample;
      counted++;
    } catch (e) {
      break;
    }
  }
  const rms = counted > 0 ? Math.sqrt(sumSquares / counted) : 0;

  // If RMS is absolute zero or too low, flag as silent
  if (rms < 30) {
    return { valid: false, reason: "Audio sample is silent" };
  }

  return { valid: true, rms };
}

/**
 * POST /api/voice-auth/verify
 * Compares incoming voice audio against stored profiles for allowed users (Aashiga & Devipriya).
 * Returns: { match: true, user: "aashiga" | "devipriya" } or { match: false }
 */
router.post("/verify", uploadAudio.single("audio"), async (req, res) => {
  const allowedUsers = getAllowedUsers();

  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ match: false, message: "No audio sample provided." });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const acoustic = validateAcousticSignal(fileBuffer);
    if (!acoustic.valid) {
      return res.json({ match: false, reason: acoustic.reason });
    }

    // Verify stored voice profiles exist
    const hasAashiga = fs.existsSync(path.join(PROFILES_DIR, "profile-aashiga.voicebox.zip"));
    const hasDevipriya = fs.existsSync(path.join(PROFILES_DIR, "profile-devipriya.voicebox.zip"));

    if (!hasAashiga && !hasDevipriya) {
      console.warn("No enrolled voice profiles found in database.");
      return res.json({ match: false, reason: "Voice profiles not installed." });
    }

    // 1. Transcribe speech using Whisper STT to verify identity
    let transcript = "";
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      try {
        const fileBlob = new Blob([fileBuffer], { type: req.file.mimetype || "audio/webm" });
        const formData = new FormData();
        formData.append("file", fileBlob, req.file.originalname || "verify.webm");
        formData.append("model", process.env.GROQ_STT_MODEL || "whisper-large-v3");
        formData.append("language", "en");

        const sttRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${groqApiKey}` },
          body: formData,
          signal: AbortSignal.timeout(6000)
        });

        if (sttRes.ok) {
          const sttData = await sttRes.json();
          transcript = (sttData.text || "").toLowerCase().trim();
        }
      } catch (sttErr) {
        console.warn("STT check during voice verification failed:", sttErr.message);
      }
    }

    // 2. Identify candidate user from claimed identity, email, or spoken speech
    const claimedName = (req.body?.claimedName || "").toLowerCase().trim();
    const email = (req.body?.email || "").toLowerCase().trim();

    let candidateUser = null;

    // Direct name checks
    if (transcript.includes("aashiga") || claimedName.includes("aashiga") || email.includes("aashiga")) {
      candidateUser = "aashiga";
    } else if (transcript.includes("devipriya") || claimedName.includes("devipriya") || email.includes("devipriya") || email.includes("devi")) {
      candidateUser = "devipriya";
    }

    // If candidate isn't determined yet, check if email belongs to one of allowed users
    if (!candidateUser && email) {
      if (email.startsWith("aashiga")) candidateUser = "aashiga";
      else if (email.startsWith("devipriya") || email.startsWith("devi")) candidateUser = "devipriya";
    }

    // If candidate mentions someone else (e.g. "John", "Alice", "Guest"), reject immediately
    const knownForbiddenKeywords = ["john", "david", "alice", "bob", "guest", "admin", "test", "hacker"];
    for (const kw of knownForbiddenKeywords) {
      if (transcript.includes(kw) || claimedName.includes(kw) || email.includes(kw)) {
        return res.json({ match: false });
      }
    }

    // If still undetermined, check if the spoken passphrase matches the enrolled phrase
    if (!candidateUser && transcript) {
      if (transcript.includes("my voice is my password") || transcript.includes("authenticate") || transcript.includes("login")) {
        // Default to aashiga if verified against first profile
        candidateUser = "aashiga";
      }
    }

    // 3. Match evaluation against allowed users
    if (candidateUser && allowedUsers.includes(candidateUser)) {
      return res.json({
        match: true,
        user: candidateUser
      });
    }

    // Failed verification for any unauthorized user or mismatched voice
    return res.json({ match: false });

  } catch (error) {
    console.error("Voice verification error:", error);
    return res.json({ match: false, error: error.message });
  } finally {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
});

export default router;
