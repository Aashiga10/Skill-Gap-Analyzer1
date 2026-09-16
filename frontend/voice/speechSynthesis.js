/**
 * Streaming TTS & Audio Playback with Smooth Queuing & Instant Barge-In
 * Supports Supertonic in-browser neural TTS and seamless fallback to native Web Speech API.
 * Smooth queuing prevents sentences from cutting each other off.
 */

// Global unlocker for browser Autoplay policies
function unlockSpeechEngines() {
    try {
        if ('speechSynthesis' in window && speechSynthesis.paused) {
            speechSynthesis.resume();
        }
    } catch(e) {}
    try {
        if (window.supertonicTTS?.audioContext && window.supertonicTTS.audioContext.state === 'suspended') {
            window.supertonicTTS.audioContext.resume();
        }
    } catch(e) {}
}

if (typeof window !== "undefined") {
    ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
        window.addEventListener(evt, unlockSpeechEngines, { passive: true });
    });
}

class SpeechSynthesisWrapper {
    constructor() {
        this.sentenceQueue = [];
        this.isPlaying = false;
        this.currentUtterance = null;
        this.speechStartTime = 0;
        this.speechEndTime = 0;
        this.recentUtterances = []; // [{ text, time }]
        this.activeSpeechToken = 0;
        this.pendingTimeout = null;
    }

    recordSpoken(text) {
        if (!text) return;
        const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!clean) return;
        const now = Date.now();
        this.recentUtterances = this.recentUtterances.filter(u => now - u.time < 20000);
        this.recentUtterances.push({ text: clean, time: now });
        if (window.V) {
            window.V.recentSpokenPhrases = this.recentUtterances;
        }
    }

    isRecentSpeech(text) {
        if (!text) return false;
        const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!clean) return false;

        const words = clean.split(' ');
        // Short user commands, affirmations, or responses (1-3 words) must NEVER be blocked as echo!
        if (words.length < 4) {
            return false;
        }

        const now = Date.now();
        this.recentUtterances = this.recentUtterances.filter(u => now - u.time < 15000);

        for (const u of this.recentUtterances) {
            // Exact full sentence echo
            if (u.text === clean) return true;
            // Verbatim prompt echo for phrases (>= 4 words)
            if (words.length >= 4 && (u.text.includes(clean) || clean.includes(u.text))) return true;
        }
        return false;
    }

    async speak(text, queue = false) {
        if (!text || typeof text !== 'string') return;
        const cleanText = text.trim();
        if (cleanText.length === 0) return;

        // If currently playing and queue is explicitly requested, queue it smoothly
        if (this.isPlaying && queue) {
            return new Promise((resolve) => {
                this.sentenceQueue.push({ text: cleanText, resolve });
            });
        }

        // Single-Speaker Policy: Allocate unique monotonically increasing speech token
        const token = ++this.activeSpeechToken;
        if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }

        // Halt ANY previous speech immediately across all engines
        this.sentenceQueue = [];
        if (window.supertonicTTS) {
            try { window.supertonicTTS.stop(); } catch(e) {}
        }
        if ('speechSynthesis' in window) {
            try { 
                window.speechSynthesis.cancel(); 
                window.speechSynthesis.resume();
            } catch(e) {}
        }
        if (window._activeUtterances) window._activeUtterances = [];

        this.recordSpoken(cleanText);

        // Remember last spoken text for "repeat" command
        if (window.V && window.V.voice) {
            window.V.voice.lastSpokenText = cleanText;
        }

        // 10ms settling buffer so browser audio engine cancels previous audio before starting new voice
        await new Promise(r => setTimeout(r, 10));
        if (this.activeSpeechToken !== token) return; // Discard if preempted during delay

        return this._executeSpeak(cleanText, token);
    }

    async _executeSpeak(cleanText, token) {
        if (this.activeSpeechToken !== token) return;
        this.isPlaying = true;
        this.speechStartTime = Date.now();

        // Enforce mutual exclusion: ensure no audio source is already running
        if (window.youtubeTools) {
            try { window.youtubeTools.pause(); } catch(e) {}
        }

        if (window.V) {
            window.V.isSpeaking = true;
            if (window.V.voice) {
                window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.SPEAKING : "SPEAKING";
                window.V.voice.speaking = true;
            }
            if (window.V.logEvent) {
                window.V.logEvent("TTS_STARTED", { text: cleanText });
            }
        }

        if (window.setVoiceStatus) {
            window.setVoiceStatus(cleanText);
        }

        // 1. Try Supertonic In-Browser Neural TTS ONLY if already loaded & ready (and online)
        const preferredPersona = (!navigator.onLine) ? 'native' : (localStorage.getItem('voicePersona') || 'native');
        if (preferredPersona !== "native" && window.supertonicTTS) {
            if (window.supertonicTTS.status === "ready") {
                try {
                    if ('speechSynthesis' in window) {
                        try { speechSynthesis.cancel(); } catch(e) {}
                    }
                    await window.supertonicTTS.speak(cleanText, preferredPersona);
                    if (this.activeSpeechToken === token) {
                        this._onUtteranceComplete(token);
                    }
                    return;
                } catch (supertonicErr) {
                    console.warn("[TTS] Supertonic playback failed, falling back to native:", supertonicErr);
                    // Fall through to native SpeechSynthesis below
                }
            } else if (window.supertonicTTS.status === "idle" && navigator.onLine) {
                window.supertonicTTS.loadModels();
            }
        }

        // 2. Browser Native SpeechSynthesis (instant, zero-download, 100% offline-reliable)
        if (!('speechSynthesis' in window)) {
            console.warn("SpeechSynthesis not supported in this browser.");
            this._onUtteranceComplete(token);
            return;
        }

        return new Promise((resolve) => {
            if (this.activeSpeechToken !== token) return resolve();

            try {
                if (speechSynthesis.paused) {
                    speechSynthesis.resume();
                }
            } catch(e) {}

            const u = new SpeechSynthesisUtterance(cleanText);
            u.lang = 'en-US';
            this.currentUtterance = u;
            
            // Prevent Chrome Garbage Collection bug from prematurely killing speech
            window._activeUtterances = window._activeUtterances || [];
            window._activeUtterances.push(u);

            const voiceRate = parseFloat(localStorage.getItem('voiceRate') || (window.V && window.V.rate) || '1.25');
            u.rate = isNaN(voiceRate) ? 1.25 : Math.max(0.8, Math.min(1.8, voiceRate));

            // Select fast, natural, 100% offline-ready local English voice (0ms delay)
            try {
                const voices = speechSynthesis.getVoices();
                if (voices && voices.length > 0) {
                    const englishVoices = voices.filter(v => v.lang && /en[-_]/i.test(v.lang));
                    const pool = englishVoices.length ? englishVoices : voices;
                    
                    // Prioritize local system voices (zero internet required, instant playback)
                    const localVoices = pool.filter(v => v.localService === true);
                    const preferredLocal = (localVoices.length > 0)
                        ? (localVoices.find(v => /david|zira|mark|george|samantha|daniel|karen|hazel/i.test(v.name)) || localVoices[0])
                        : null;

                    if (preferredLocal) {
                        u.voice = preferredLocal;
                    } else if (navigator.onLine) {
                        const cloudVoice = pool.find(v => /natural|samantha|jenny|google/i.test(v.name));
                        if (cloudVoice) u.voice = cloudVoice;
                    } else {
                        if (pool.length > 0) u.voice = pool[0];
                    }
                }
            } catch(e) {}

            let finished = false;
            let resumeInterval = null;
            const cleanup = () => {
                if (finished) return;
                finished = true;
                if (resumeInterval) {
                    clearInterval(resumeInterval);
                    resumeInterval = null;
                }
                if (watchdogTimer) clearTimeout(watchdogTimer);
                const idx = window._activeUtterances.indexOf(u);
                if (idx !== -1) window._activeUtterances.splice(idx, 1);
                if (this.activeSpeechToken === token) {
                    this._onUtteranceComplete(token);
                }
                resolve();
            };

            // Chromium Issue 679437: Periodic resume prevents browser from cutting speech mid-sentence
            resumeInterval = setInterval(() => {
                if (!finished && 'speechSynthesis' in window) {
                    try { window.speechSynthesis.resume(); } catch(e) {}
                } else if (resumeInterval) {
                    clearInterval(resumeInterval);
                    resumeInterval = null;
                }
            }, 1500);

            // Watchdog: Ensure isPlaying never locks permanently
            const wordCount = cleanText.split(/\s+/).length;
            const maxDuration = Math.min(15000, Math.max(3000, wordCount * 550));
            const watchdogTimer = setTimeout(() => {
                cleanup();
            }, maxDuration);

            u.onend = () => {
                cleanup();
                if (window.V && window.V.logEvent) {
                    window.V.logEvent("TTS_COMPLETED");
                }
            };

            u.onerror = (e) => {
                console.warn("[SpeechSynthesis] Utterance notice:", e);
                // If it failed with a specific remote voice when offline, immediately retry with default local voice!
                if (u.voice && !finished) {
                    try {
                        const fallbackU = new SpeechSynthesisUtterance(cleanText);
                        fallbackU.lang = 'en-US';
                        fallbackU.rate = u.rate;
                        fallbackU.onend = () => cleanup();
                        fallbackU.onerror = () => cleanup();
                        window.speechSynthesis.speak(fallbackU);
                        return;
                    } catch(err) {}
                }
                cleanup();
            };

            try {
                if ('speechSynthesis' in window) {
                    try {
                        if (window.speechSynthesis.paused) {
                            window.speechSynthesis.resume();
                        }
                    } catch(e) {}
                    window.speechSynthesis.speak(u);
                    try {
                        window.speechSynthesis.resume();
                    } catch(e) {}
                } else {
                    cleanup();
                }
            } catch(err) {
                console.error("[SpeechSynthesis] speak error:", err);
                cleanup();
            }
        });
    }

    _onUtteranceComplete(token) {
        if (token && this.activeSpeechToken !== token) return;
        this.isPlaying = false;
        this.speechEndTime = Date.now();
        this.currentUtterance = null;

        // Process next queued utterance smoothly if present
        if (this.sentenceQueue.length > 0) {
            const nextItem = this.sentenceQueue.shift();
            const nextToken = ++this.activeSpeechToken;
            this._executeSpeak(nextItem.text, nextToken).then(() => {
                if (typeof nextItem.resolve === 'function') nextItem.resolve();
            });
            return;
        }

        if (window.V) {
            window.V.isSpeaking = false;
            if (window.V.voice) {
                window.V.voice.speaking = false;
                window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.IDLE : "IDLE";
            }
        }
    }

    /**
     * Instant Barge-In: Halts audio playback immediately when user explicitly requests interruption
     */
    bargeIn() {
        this.activeSpeechToken++;
        if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }
        this.sentenceQueue = [];
        if (window.supertonicTTS) {
            try { window.supertonicTTS.stop(); } catch(e) {}
        }
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
                window.speechSynthesis.resume();
            } catch (e) {}
        }
        this.currentUtterance = null;
        this.isPlaying = false;
        this.speechEndTime = Date.now();
        if (window._activeUtterances) window._activeUtterances = [];
        if (window.V) {
            window.V.isSpeaking = false;
            if (window.V.voice) {
                window.V.voice.speaking = false;
                window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.IDLE : "IDLE";
            }
        }
    }

    stop() {
        this.bargeIn();
    }
}

window.speechSynthesisWrapper = new SpeechSynthesisWrapper();
window.speak = (text, queueOrCallback) => {
    const queue = typeof queueOrCallback === 'boolean' ? queueOrCallback : false;
    const onDone = typeof queueOrCallback === 'function' ? queueOrCallback : undefined;
    return window.speechSynthesisWrapper.speak(text, queue).then(() => {
        if (onDone) onDone();
    });
};
window.stopSpeaking = () => window.speechSynthesisWrapper.bargeIn();
window.isRecentSpeech = (text) => window.speechSynthesisWrapper ? window.speechSynthesisWrapper.isRecentSpeech(text) : false;

