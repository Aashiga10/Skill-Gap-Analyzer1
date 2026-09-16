/**
 * Streaming Speech Recognition & Continuous Audio Mode
 * Bridges 16/24kHz AudioCapture, VAD / TurnDetector, and ConversationOrchestrator.
 */

class StreamingSpeechRecognition {
    constructor() {
        this.isContinuous = false;
        this.nativeRecognition = null;
        this.usingNative = false;
        this.lastNativeTurnTime = 0;
        this.interimDebounceTimer = null;
        this.lastProcessedTurnText = "";
        this.lastProcessedTurnTime = 0;
    }

    /**
     * Start continuous real-time conversational mode (ChatGPT style)
     */
    async startContinuous() {
        if (this.isContinuous) return;

        if (window.V) {
            window.V.listening = true;
            if (window.V.voice) {
                window.V.voice.listening = true;
                window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.LISTENING : "LISTENING";
            }
        }
        this.isContinuous = true;
        updateMicVisuals(true);
        if (window.updateMicUI) window.updateMicUI();

        if (window.setVoiceStatus) {
            window.setVoiceStatus("Listening... (Speak freely)");
        }

        // Start native recognition immediately for instant voice responsiveness
        this.startNativeFallback();

        // Initialize in-browser neural STT worker (Silero VAD + Whisper)
        if (window.sttWorkerManager) {
            window.sttWorkerManager.init();
        }

        const started = await window.audioCapture.startCapture();
        if (!started) {
            const err = window.audioCapture?.lastError;
            console.warn("AudioCapture failed, continuing with native Web Speech API:", err);
            this.usingNative = true;
            return;
        }

        this.usingNative = false;

        window.turnDetector.start({
            onSpeechStart: () => {
                if (window.setVoiceStatus) {
                    window.setVoiceStatus("Hearing you speak...");
                }
            },
            onBargeIn: () => {
                if (window.setVoiceStatus) {
                    window.setVoiceStatus("Interrupted assistant. Listening to you...");
                }
            },
            onTurnComplete: async (audioBlob, durationMs) => {
                // If native SpeechRecognition is active in this browser, turns are handled directly
                // through native SpeechRecognition with zero latency. Avoid sending background noise chunks
                // to backend STT, which causes Whisper hallucinations on ambient noise.
                const hasNativeRec = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
                if (hasNativeRec && this.nativeRecognition) {
                    return;
                }

                // Do not send turn if assistant is actively speaking or just finished within 1.2s
                const isAssistantSpeaking = Boolean(
                    (window.V && window.V.isSpeaking) ||
                    (window.speechSynthesisWrapper && window.speechSynthesisWrapper.isPlaying) ||
                    (window.supertonicTTS && window.supertonicTTS.status === "speaking")
                );
                if (isAssistantSpeaking) return;

                const timeSinceSpeechEnd = Date.now() - (window.speechSynthesisWrapper?.speechEndTime || 0);
                if (timeSinceSpeechEnd < 1200) return;

                // Fallback to backend STT ONLY if native recognition hasn't just processed a turn in last 3.5s
                const timeSinceNativeTurn = Date.now() - (this.lastNativeTurnTime || 0);
                if (timeSinceNativeTurn > 3500 && window.conversationOrchestrator) {
                    await window.conversationOrchestrator.processUserTurn(audioBlob);
                }
            }
        });
    }

    startNativeFallback() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) return false;

        try {
            if (this.nativeRecognition) {
                try { this.nativeRecognition.abort(); } catch(e) {}
            }

            const rec = new SpeechRec();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';

            rec.onresult = async (e) => {
                const results = e.results;
                if (!results || results.length === 0) return;
                const last = results[results.length - 1];
                if (!last) return;
                const transcript = last[0].transcript ? last[0].transcript.trim() : "";
                if (!transcript) return;

                const cleanT = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
                const words = cleanT.split(' ');

                // ── ANTI-CLASH RULE 1: Mute STT while TTS speaks, except for stop/cancel/wait ──
                // Never use window.speechSynthesis.speaking because Chromium permanently sticks it to true
                const isAssistantSpeaking = Boolean(
                    (window.V && window.V.isSpeaking) ||
                    (window.speechSynthesisWrapper && window.speechSynthesisWrapper.isPlaying) ||
                    (window.supertonicTTS && window.supertonicTTS.status === "speaking")
                );

                const timeSinceSpeechEnd = Date.now() - (window.speechSynthesisWrapper?.speechEndTime || 0);
                const inSpeechCooldown = (window.speechSynthesisWrapper?.speechEndTime > 0) && timeSinceSpeechEnd < 900;

                // Check if the recognized speech is acoustic echo from recent assistant speech
                const isSelfEcho = Boolean(
                    window.isRecentSpeech && window.isRecentSpeech(cleanT)
                );

                if (isSelfEcho) {
                    console.log("🔇 [AcousticEchoCancelled] Dropping self-interaction transcript:", cleanT);
                    if (window.V && window.V.logEvent) {
                        window.V.logEvent("SELF_SPEECH_REJECTED", { transcript: cleanT });
                    }
                    return;
                }

                if (isAssistantSpeaking) {
                    const isInterruptKeyword = /^(stop|cancel|wait|shut up|quiet|pause)$/i.test(cleanT) ||
                        words.includes("stop") || words.includes("cancel") || words.includes("quiet") || words.includes("pause") || words.includes("shut up");

                    if (isInterruptKeyword) {
                        console.log("🛑 [Interrupt] User explicitly interrupted assistant with keyword:", cleanT);
                        if (window.stopSpeaking) window.stopSpeaking();
                        if (window.speechSynthesisWrapper) window.speechSynthesisWrapper.bargeIn();
                        if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch(e) {} }
                        if (window.supertonicTTS) window.supertonicTTS.stop();
                        if (window.youtubeTools) window.youtubeTools.pause();
                        if (window.conversationOrchestrator) {
                            await window.conversationOrchestrator.processTextTurn("stop");
                        }
                    } else {
                        console.log("🔇 [SpeechIgnoredWhileSpeaking] Dropped acoustic leak while assistant is speaking:", cleanT);
                    }
                    return; // Strictly never execute commands or self-trigger while assistant is speaking!
                }

                if (inSpeechCooldown) {
                    console.log("🔇 [SpeechCooldown] Dropped reverb/echo tail right after assistant finished speaking:", cleanT);
                    return; // Ignore reverb tail right after assistant finishes talking
                }

                // Check instant blind modal voice response without waiting
                const isBlindModalActive = Boolean(
                    (window.V && (window.V.blindCheckActive || (window.V.voice && window.V.voice.blindCheckActive))) ||
                    (document.getElementById("blind-check-modal") && document.getElementById("blind-check-modal").style.display !== "none")
                );

                if (isBlindModalActive) {
                    // Drop prompt echo from speakers
                    if (cleanT.includes('are you') || cleanT.includes('or blind') || cleanT.includes('standard visual') || cleanT.includes('welcome to')) {
                        console.log("🔇 [SpeechRecognition] Dropped prompt echo:", cleanT);
                        return;
                    }

                    if (window.updateBlindModalStatus) {
                        window.updateBlindModalStatus('🎙️ Hearing you: "' + transcript + '"', 'Recognizing your choice: Say Yes or No');
                    }

                    const isNegative = (
                        /^(n+o+|n+o+p+e*|n+a+h*|wrong|false|disable|n)$/i.test(cleanT) ||
                        words.some(w => /^(n+o+|n+o+p+e*|n+a+h*|disable)$/i.test(w)) ||
                        cleanT.includes("not blind") || cleanT.includes("i am not blind") || cleanT.includes("im not blind") ||
                        cleanT.includes("disable voice") || cleanT.includes("no thanks") || cleanT.includes("no thank you")
                    );

                    const isAffirmative = !isNegative && (
                        /^(y+(e+s+|e+a+h*|e+p*|u+p*|a+)|sure|correct|confirm|proceed|ok|okay|do it|true|enable|s|y)$/i.test(cleanT) ||
                        words.some(w => /^(y+(e+s+|e+a+h*|e+p*|u+p*|a+)|sure|correct|confirm|proceed|ok|okay|true|enable)$/i.test(w)) ||
                        cleanT.includes("i am blind") || cleanT.includes("im blind") || cleanT.includes("i am visually impaired") ||
                        cleanT.includes("enable voice") || cleanT.includes("yes please") || cleanT.includes("yes i am")
                    );

                    if (isAffirmative) {
                        console.log("🎙️ [BlindCheck] Confirmed YES via voice:", transcript);
                        if (this.interimDebounceTimer) {
                            clearTimeout(this.interimDebounceTimer);
                            this.interimDebounceTimer = null;
                        }
                        this.lastProcessedTurnTime = Date.now();
                        this.lastProcessedTurnText = cleanT;
                        if (window.stopSpeaking) window.stopSpeaking();
                        if (window.confirmBlindUser) {
                            window.confirmBlindUser(true);
                            return;
                        }
                    } else if (isNegative) {
                        console.log("🎙️ [BlindCheck] Confirmed NO via voice:", transcript);
                        if (this.interimDebounceTimer) {
                            clearTimeout(this.interimDebounceTimer);
                            this.interimDebounceTimer = null;
                        }
                        this.lastProcessedTurnTime = Date.now();
                        this.lastProcessedTurnText = cleanT;
                        if (window.stopSpeaking) window.stopSpeaking();
                        if (window.confirmBlindUser) {
                            window.confirmBlindUser(false);
                            return;
                        }
                    }
                }

                // Dispatch helper with deduplication
                const dispatchTurn = async (rawTranscript) => {
                    if (!rawTranscript || !rawTranscript.trim()) return;
                    const clean = rawTranscript.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
                    const now = Date.now();
                    if (this.lastProcessedTurnText === clean && (now - this.lastProcessedTurnTime < 2000)) {
                        console.log("🔇 [STT Deduplication] Dropping duplicate turn:", clean);
                        return;
                    }
                    this.lastProcessedTurnText = clean;
                    this.lastProcessedTurnTime = now;
                    this.lastNativeTurnTime = now;
                    if (window.conversationOrchestrator) {
                        await window.conversationOrchestrator.processTextTurn(rawTranscript);
                    }
                };

                // Fast-Path: If transcript matches an explicit high-priority intent, dispatch immediately with 0ms lag!
                const instantIntent = window.detectIntent ? window.detectIntent(cleanT) : null;
                const isInstantCommand = instantIntent && instantIntent.intent !== "UNKNOWN" && instantIntent.intent !== "ANSWER";

                if (isInstantCommand || last.isFinal) {
                    if (this.interimDebounceTimer) {
                        clearTimeout(this.interimDebounceTimer);
                        this.interimDebounceTimer = null;
                    }
                    if (transcript) {
                        await dispatchTurn(transcript);
                    }
                } else {
                    // Conversational pause detection: 350ms for ultra-responsive voice replies
                    if (this.interimDebounceTimer) clearTimeout(this.interimDebounceTimer);
                    this.interimDebounceTimer = setTimeout(async () => {
                        if (transcript) {
                            await dispatchTurn(transcript);
                        }
                    }, 350);
                }
            };

            rec.onerror = (e) => {
                console.warn("Native speech recognition error:", e.error);
                if (e.error === 'not-allowed') {
                    if (window.setVoiceStatus) window.setVoiceStatus("Microphone permission denied in browser.");
                    if (window.showToast) window.showToast("Microphone permission denied.", "error");
                    this.stopContinuous();
                }
            };

            rec.onend = () => {
                if (this.isContinuous) {
                    setTimeout(() => {
                        if (this.isContinuous) {
                            try { rec.start(); } catch(e) {}
                        }
                    }, 200);
                }
            };

            rec.start();
            this.nativeRecognition = rec;
            if (window.setVoiceStatus) {
                window.setVoiceStatus("Listening via Web Speech API...");
            }
            return true;
        } catch (e) {
            console.warn("Failed to start native Web Speech API:", e);
            return false;
        }
    }

    stopContinuous() {
        this.isContinuous = false;
        this.usingNative = false;
        if (window.V) {
            window.V.listening = false;
            if (window.V.voice) {
                window.V.voice.listening = false;
                window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.IDLE : "IDLE";
            }
        }
        if (this.interimDebounceTimer) {
            clearTimeout(this.interimDebounceTimer);
            this.interimDebounceTimer = null;
        }
        if (this.nativeRecognition) {
            try { this.nativeRecognition.stop(); } catch(e) {}
            this.nativeRecognition = null;
        }
        if (window.sttWorkerManager) window.sttWorkerManager.stop();
        if (window.turnDetector) window.turnDetector.stop();
        if (window.audioCapture) window.audioCapture.stopCapture();
        updateMicVisuals(false);
        if (window.updateMicUI) window.updateMicUI();

        if (window.setVoiceStatus) {
            window.setVoiceStatus("Voice assistant paused.");
        }
    }
}

window.streamingSpeechRecognition = new StreamingSpeechRecognition();

/**
 * Backward-compatible one-shot listen() for discrete Q&A steps (like password entry)
 */
async function listen() {
    return new Promise(async (resolve) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: true, noiseSuppression: true } 
            });
            const chunks = [];
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            let autoStopTimer = null;

            recorder.onstop = async () => {
                clearTimeout(autoStopTimer);
                stream.getTracks().forEach(t => t.stop());

                const blob = new Blob(chunks, { type: 'audio/webm' });
                window.lastAudioBlob = blob;
                try {
                    const fd = new FormData();
                    fd.append("audio", blob, "rec.webm");
                    const res = await fetch("/api/stt", { method: "POST", body: fd });
                    if (!res.ok) throw new Error("STT error");
                    const data = await res.json();
                    resolve({ text: data.text ? data.text.trim() : "", confidence: 1.0, audioBlob: blob });
                } catch (err) {
                    resolve({ text: "", confidence: 0, audioBlob: blob, error: err });
                }
            };

            recorder.start();
            // Max 5s record window for discrete Q&A
            autoStopTimer = setTimeout(() => {
                if (recorder.state === "recording") recorder.stop();
            }, 5000);

        } catch (e) {
            resolve({ text: "", confidence: 0, error: e });
        }
    });
}

function stopListening() {
    if (window.streamingSpeechRecognition) {
        window.streamingSpeechRecognition.stopContinuous();
    }
}

function updateMicVisuals(isListening) {
    const micBtn = document.getElementById("mic-btn");
    const micToggle = document.getElementById("mic-toggle");

    if (micBtn) {
        if (isListening) micBtn.classList.add("listening");
        else micBtn.classList.remove("listening");
    }
    if (micToggle) {
        micToggle.textContent = isListening ? "🛑 Stop Listening" : "🎤 Start Listening";
    }
}

window.listen = listen;
window.stopListening = stopListening;
