/**
 * Supertonic In-Browser Neural TTS Pipeline (WebGPU / WASM)
 * Powered by onnx-community/Supertonic-TTS-ONNX and 10 voice embeddings (F1-F5, M1-M5).
 * Fallback to browser SpeechSynthesis is handled by SpeechSynthesisWrapper.
 */

class SupertonicTTS {
    constructor() {
        this.status = "idle"; // "idle" | "loading" | "ready" | "speaking" | "error"
        this.loadProgress = 0;
        this.selectedVoice = localStorage.getItem('voicePersona') || 'native';
        this.modelPipeline = null;
        this.embeddings = null;
        this.audioContext = null;
        this.gainNode = null;
        this.currentSource = null;
        this.currentPlaybackResolve = null;
        this.isAborted = false;
        this.device = "wasm";
        this.loadingPromise = null;
        this.listeners = [];

        this.voices = {
            F1: { id: "F1", name: "Friendly Female", gender: "Female", desc: "Warm, natural and conversational" },
            F2: { id: "F2", name: "Professional Female", gender: "Female", desc: "Clear, crisp corporate tone" },
            F3: { id: "F3", name: "Energetic Female", gender: "Female", desc: "Upbeat and dynamic delivery" },
            F4: { id: "F4", name: "Warm Female", gender: "Female", desc: "Gentle and reassuring tone" },
            F5: { id: "F5", name: "Calm Female", gender: "Female", desc: "Relaxed, paced narration" },
            M1: { id: "M1", name: "Clear Male", gender: "Male", desc: "Standard neutral broadcast voice" },
            M2: { id: "M2", name: "Authoritative Male", gender: "Male", desc: "Confident, deeper executive tone" },
            M3: { id: "M3", name: "Warm Male", gender: "Male", desc: "Friendly, casual conversational" },
            M4: { id: "M4", name: "Dynamic Male", gender: "Male", desc: "Engaging and expressive style" },
            M5: { id: "M5", name: "Deep Male", gender: "Male", desc: "Resonant, low-frequency timbre" }
        };
    }

    onStatusChange(fn) {
        if (typeof fn === 'function') this.listeners.push(fn);
    }

    setStatus(newStatus, detail = {}) {
        this.status = newStatus;
        this.listeners.forEach(fn => {
            try { fn(newStatus, detail); } catch(e) {}
        });
        const statusEl = document.getElementById("voice-model-status");
        if (statusEl) {
            if (newStatus === "loading") {
                statusEl.style.display = "block";
                statusEl.innerHTML = `⚡ Loading AI Voice (${Math.round(this.loadProgress)}%)...`;
            } else if (newStatus === "ready") {
                statusEl.style.display = "block";
                statusEl.innerHTML = `✨ Neural Voice Ready (${this.device.toUpperCase()})`;
                setTimeout(() => { if (this.status === "ready") statusEl.style.display = "none"; }, 3000);
            } else if (newStatus === "error") {
                statusEl.style.display = "block";
                statusEl.innerHTML = `⚠️ Neural Voice unavailable; using standard voice.`;
            } else {
                statusEl.style.display = "none";
            }
        }
    }

    async getDevice() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (isIOS) {
            console.debug("[SupertonicTTS] iOS detected, using WASM for stability");
            return "wasm";
        }
        if (typeof navigator !== "undefined" && navigator.gpu) {
            try {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) return "webgpu";
            } catch (e) {
                console.debug("[SupertonicTTS] WebGPU check failed:", e);
            }
        }
        return "wasm";
    }

    async loadModels(onProgress) {
        if (this.status === "ready" && this.modelPipeline && this.embeddings) {
            return true;
        }
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.setStatus("loading");
        this.loadingPromise = (async () => {
            try {
                // Dynamically import @huggingface/transformers ESM from CDN
                const hf = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm");
                const { pipeline, env } = hf;

                if (env.backends && env.backends.onnx) {
                    env.backends.onnx.logSeverityLevel = 3; // Errors only
                    env.backends.onnx.logVerbosityLevel = 0;
                }
                env.useBrowserCache = true;
                env.allowLocalModels = false;

                this.device = await this.getDevice();
                console.log(`[SupertonicTTS] Initializing on ${this.device}...`);

                // 1. Load voice embeddings from local static assets (/voices/{id}.bin)
                const voiceIds = Object.keys(this.voices);
                const embeddingEntries = await Promise.all(
                    voiceIds.map(async (id) => {
                        const res = await fetch(`/voices/${id}.bin`);
                        if (!res.ok) throw new Error(`Failed to load voice embedding: ${id}`);
                        const buf = await res.arrayBuffer();
                        return [id, new Float32Array(buf)];
                    })
                );
                this.embeddings = Object.fromEntries(embeddingEntries);
                console.log("[SupertonicTTS] Loaded 10 voice embeddings successfully.");

                // 2. Load Supertonic ONNX TTS Pipeline
                const progressMap = new Map();
                const progressCallback = (info) => {
                    if (info.status === "progress" && info.file) {
                        progressMap.set(info.file, (info.loaded || 0) / (info.total || 1));
                        const sum = Array.from(progressMap.values()).reduce((a, b) => a + b, 0);
                        this.loadProgress = Math.min(99, (sum / Math.max(1, progressMap.size)) * 100);
                        this.setStatus("loading", { progress: this.loadProgress });
                    }
                    if (typeof onProgress === 'function') onProgress(info);
                };

                const ttsPipeline = await pipeline("text-to-speech", "onnx-community/Supertonic-TTS-ONNX", {
                    device: this.device,
                    progress_callback: progressCallback
                });

                // Warm up pipeline with 1 step
                try {
                    await ttsPipeline("Hi", {
                        speaker_embeddings: this.embeddings[this.selectedVoice] || this.embeddings["F1"],
                        num_inference_steps: 1,
                        speed: 1.0
                    });
                } catch(warmErr) {
                    console.debug("[SupertonicTTS] Warmup notice:", warmErr);
                }

                this.modelPipeline = ttsPipeline;
                this.loadProgress = 100;
                this.setStatus("ready");
                console.log("[SupertonicTTS] Pipeline ready!");
                return true;
            } catch (err) {
                console.error("[SupertonicTTS] Model loading failed:", err);
                this.setStatus("error", { error: err });
                return false;
            } finally {
                this.loadingPromise = null;
            }
        })();

        return this.loadingPromise;
    }

    normalizeText(text) {
        if (!text || typeof text !== 'string') return "";
        return text
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, "-")
            .replace(/\u2026/g, "...")
            .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "")
            .replace(/https?:\/\/\S+/gi, "link")
            .replace(/\s+/g, " ")
            .trim();
    }

    splitIntoChunks(text) {
        const normalized = this.normalizeText(text);
        if (!normalized) return [];

        // Split by sentences or punctuation pauses
        const rawSentences = normalized.split(/(?<=[.!?])\s+|\n+/);
        const chunks = [];
        let currentChunk = "";

        for (const sent of rawSentences) {
            const s = sent.trim();
            if (!s) continue;

            if ((currentChunk + " " + s).trim().length > 180) {
                if (currentChunk.trim()) chunks.push(currentChunk.trim());
                currentChunk = s;
            } else {
                currentChunk = currentChunk ? (currentChunk + " " + s) : s;
            }
        }
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks.length > 0 ? chunks : [normalized];
    }

    async initAudioContext() {
        if (!this.audioContext || this.audioContext.state === "closed") {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === "suspended") {
            try { await this.audioContext.resume(); } catch(e) {}
        }
        if (!this.gainNode) {
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
        }
    }

    async speak(text, voiceId = null) {
        if (!text || !text.trim()) return;

        const targetVoice = voiceId || this.selectedVoice || "F1";
        if (targetVoice === "native") {
            throw new Error("Native voice requested; use SpeechSynthesis");
        }

        const isReady = await this.loadModels();
        if (!isReady || !this.modelPipeline || !this.embeddings) {
            throw new Error("Supertonic TTS models not ready");
        }

        this.stop(); // Stop any current playback
        this.isAborted = false;
        this.setStatus("speaking");
        await this.initAudioContext();

        const chunks = this.splitIntoChunks(text);
        const speakerEmbedding = this.embeddings[targetVoice] || this.embeddings["F1"];
        const quality = this.device === "webgpu" ? 18 : 10;
        const voiceRate = parseFloat(localStorage.getItem('voiceRate') || '1');
        const speed = isNaN(voiceRate) ? 1.08 : Math.max(0.7, Math.min(1.5, voiceRate * 1.05));

        try {
            for (let i = 0; i < chunks.length; i++) {
                if (this.isAborted) break;
                const chunk = chunks[i];

                const output = await this.modelPipeline(chunk, {
                    speaker_embeddings: speakerEmbedding,
                    num_inference_steps: quality,
                    speed: speed
                });

                if (this.isAborted) break;

                const rawAudio = output.audio;
                const sampleRate = output.sampling_rate || 24000;

                // Play this audio chunk
                await this.playBuffer(rawAudio, sampleRate);
            }
        } catch (err) {
            console.warn("[SupertonicTTS] Error during playback chunk:", err);
            throw err;
        } finally {
            if (!this.isAborted) {
                this.setStatus("ready");
            }
        }
    }

    playBuffer(float32Array, sampleRate) {
        return new Promise((resolve) => {
            if (this.isAborted || !this.audioContext) {
                return resolve();
            }

            try {
                const buffer = this.audioContext.createBuffer(1, float32Array.length, sampleRate);
                buffer.getChannelData(0).set(float32Array);

                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.gainNode);
                this.currentSource = source;
                this.currentPlaybackResolve = resolve;

                source.onended = () => {
                    this.currentSource = null;
                    this.currentPlaybackResolve = null;
                    resolve();
                };

                source.start();
            } catch (e) {
                console.error("[SupertonicTTS] Audio playback error:", e);
                resolve();
            }
        });
    }

    stop() {
        this.isAborted = true;
        if (this.currentSource) {
            try { this.currentSource.stop(); } catch(e) {}
            this.currentSource = null;
        }
        if (this.currentPlaybackResolve) {
            const res = this.currentPlaybackResolve;
            this.currentPlaybackResolve = null;
            res();
        }
        if (this.status === "speaking") {
            this.setStatus("ready");
        }
    }

    bargeIn() {
        this.stop();
    }

    setVoice(voiceId) {
        if (this.voices[voiceId] || voiceId === "native") {
            this.selectedVoice = voiceId;
            try { localStorage.setItem('voicePersona', voiceId); } catch(e) {}
            console.log(`[SupertonicTTS] Voice persona set to: ${voiceId}`);
            if (voiceId !== "native" && this.status === "idle") {
                this.loadModels();
            }
        }
    }
}

window.supertonicTTS = new SupertonicTTS();
