import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads");
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

router.post("/", upload.single("resume"), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded"
        });
    }

    console.log("File uploaded:", req.file.path);

    try {
        // Parse PDF
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        const resumeText = data.text;

        // Call Ollama to extract skills
        const aiPrompt = `Extract the top 5 technical skills from the following resume text and format them as a JSON array of strings (e.g., ["JavaScript", "React", "Node.js"]). Return ONLY the JSON array, nothing else. Resume: ${resumeText}`;

        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NVIDIA_LLM_API_KEY || process.env.NVIDIA_API_KEY}`
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-4-340b-instruct",
                messages: [{ role: "user", content: aiPrompt }]
            })
        });

        if (!response.ok) {
            throw new Error("Failed to communicate with NVIDIA API for skill extraction.");
        }

        const aiData = await response.json();
        const rawResponse = aiData.choices && aiData.choices[0] ? aiData.choices[0].message.content : "[]";
        
        // Clean up uploaded file to save space
        fs.unlinkSync(req.file.path);

        // Parse extracted skills
        let skills = [];
        try {
            const arrayMatch = rawResponse.match(/\[.*\]/s);
            if (arrayMatch) {
                skills = JSON.parse(arrayMatch[0]);
            } else {
                skills = JSON.parse(rawResponse);
            }
        } catch (parseError) {
            console.error("Failed to parse AI response:", rawResponse);
            return res.status(500).json({ success: false, message: "Failed to parse extracted skills from AI response." });
        }

        res.status(200).json({
            success: true,
            message: "Resume processed successfully",
            skills: skills
        });

    } catch (error) {
        console.error("Resume processing error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process resume: " + error.message
        });
    }
});

export default router;
