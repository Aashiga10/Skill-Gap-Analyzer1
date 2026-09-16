/**
 * STT Worker Manager
 * Bridges AudioWorklet PCM stream with in-browser Silero VAD + Whisper STT worker (/stt-worker-esm.js).
 * Falls back gracefully to native Web Speech API and backend Groq STT if unavailable.
 */

class STTWorkerManager {
    constructor() {
        this.worker = null;
        this.status = "idle"; // "idle" | "loading" | "ready" | "listening" | "recording" | "transcribing" | "error"
        this.isSupported = typeof Worker !== "undefined";
        this.isReady = false;
        this.listeners = [];
        this.initAttempted = false;
    }

    onStatus(callback) {
        if (typeof callback === 'function') this.listeners.push(callback);
    }

    emitStatus(status, data = {}) {
        this.status = status;
        this.listeners.forEach(fn => {
            try { fn(status, data); } catch(e) {}
        });
        const statusEl = document.getElementById("voice-model-status");
        if (statusEl && status === "loading") {
            statusEl.style.display = "block";
            statusEl.innerHTML = `⚡ Loading In-Browser AI Speech...`;
        }
    }

    init() {
        if (this.initAttempted || !this.isSupported) return;
        this.initAttempted = true;

        try {
            this.emitStatus("loading");
            const worker = new Worker("/stt-worker-esm.js", { type: "module" });

            worker.onmessage = async (event) => {
                const { type, status: msgStatus, message, text, isFinal } = event.data;

                switch (type) {
                    case "status":
                        if (msgStatus === "ready") {
                            this.isReady = true;
                            this.emitStatus("ready");
                            console.log("⚡ [STTWorker] In-browser Silero VAD + Whisper STT ready!");
                        } else if (msgStatus === "recording") {
                            this.emitStatus("recording");
                            if (window.setVoiceStatus) window.setVoiceStatus("Recording your voice...");
                        } else if (msgStatus === "transcribing") {
                            this.emitStatus("transcribing");
                            if (window.setVoiceStatus) window.setVoiceStatus("Transcribing in browser...");
                        } else if (msgStatus === "listening") {
                            this.emitStatus("listening");
                            if (window.setVoiceStatus && (!window.V || !window.V.isSpeaking)) {
                                window.setVoiceStatus("Listening... (Speak freely)");
                            }
                        }
                        break;

                    case "transcript":
                        if (isFinal && text && text.trim()) {
                            await this.handleTranscript(text.trim());
                        }
                        break;

                    case "error":
                        console.warn("[STTWorker] Notice:", message);
                        this.isReady = false;
                        this.emitStatus("error", { message });
                        break;
                }
            };

            worker.onerror = (err) => {
                console.warn("[STTWorker] Worker error:", err);
                this.isReady = false;
                this.emitStatus("error", { error: err });
            };

            worker.postMessage({ type: "init" });
            this.worker = worker;
        } catch (err) {
            console.warn("[STTWorker] Worker initialization failed:", err);
            this.isReady = false;
            this.emitStatus("error", { error: err });
        }
    }

    async handleTranscript(text) {
        console.log("🎙️ [STTWorker Transcript]:", text);

        const cleanT = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const words = cleanT.split(' ');

        // Check barge-in / stop while assistant is speaking (never use buggy speechSynthesis.speaking)
        const isSpeaking = Boolean(
            (window.V && window.V.isSpeaking) ||
            (window.speechSynthesisWrapper && window.speechSynthesisWrapper.isPlaying) ||
            (window.supertonicTTS && window.supertonicTTS.status === "speaking")
        );

        if (isSpeaking) {
            const isInterrupt = cleanT.includes("stop") || cleanT.includes("cancel") || cleanT.includes("wait") || cleanT.includes("pause") || cleanT.includes("shut up");
            if (isInterrupt) {
                if (window.stopSpeaking) window.stopSpeaking();
                if (window.youtubeTools) window.youtubeTools.stop();
                if (window.conversationOrchestrator) {
                    await window.conversationOrchestrator.processTextTurn("stop");
                }
            }
            return;
        }

        // Blind Check Modal Voice Bypass
        const isBlindModalActive = Boolean(
            (window.V && (window.V.blindCheckActive || (window.V.voice && window.V.voice.blindCheckActive))) ||
            (document.getElementById("blind-check-modal") && document.getElementById("blind-check-modal").style.display !== "none")
        );

        if (isBlindModalActive) {
            // Drop prompt echo from speakers
            if (cleanT.includes('are you') || cleanT.includes('or blind') || cleanT.includes('standard visual') || cleanT.includes('welcome to')) {
                console.log("🔇 [STTWorker] Dropped prompt echo:", cleanT);
                return;
            }

            const isNegative = (
                /^(no|nope|nah|wrong|false|disable|n)$/i.test(cleanT) ||
                words.includes("no") || words.includes("nope") || words.includes("nah") || words.includes("disable") ||
                cleanT.includes("not blind") || cleanT.includes("i am not blind") || cleanT.includes("im not blind") ||
                cleanT.includes("disable voice") || cleanT.includes("no thanks") || cleanT.includes("no thank you")
            );

            const isAffirmative = !isNegative && (
                /^(yes|yeah|yep|yup|sure|correct|true|enable|ya|s)$/i.test(cleanT) ||
                words.includes("yes") || words.includes("yeah") || words.includes("yep") || words.includes("yup") ||
                words.includes("sure") || words.includes("correct") || words.includes("enable") ||
                cleanT.includes("i am blind") || cleanT.includes("im blind") || cleanT.includes("i am visually impaired") ||
                cleanT.includes("enable voice") || cleanT.includes("yes please") || cleanT.includes("yes i am")
            );

            if (isAffirmative) {
                if (window.stopSpeaking) window.stopSpeaking();
                if (window.confirmBlindUser) window.confirmBlindUser(true);
                return;
            } else if (isNegative) {
                if (window.stopSpeaking) window.stopSpeaking();
                if (window.confirmBlindUser) window.confirmBlindUser(false);
                return;
            }
        }

        // Forward to Conversation Orchestrator
        if (window.conversationOrchestrator) {
            await window.conversationOrchestrator.processTextTurn(text);
        }
    }

    sendAudio(buffer) {
        if (this.worker && this.isReady) {
            this.worker.postMessage({ type: "audio", buffer });
        }
    }

    stop() {
        if (this.worker && this.isReady) {
            this.worker.postMessage({ type: "stop" });
        }
    }
}

window.sttWorkerManager = new STTWorkerManager();
