/**
 * Master Voice Assistant Controller (ChatGPT Mode)
 * Coordinates user interaction, hands-free spacebar shortcuts, and the Conversation Orchestrator.
 */

const voiceAssistant = {
    initialized: false,

    async init() {
        if (this.initialized) return;
        this.initialized = true;

        // Spacebar shortcut for Hands-Free voice interaction / instant barge-in
        window.addEventListener("keydown", async (e) => {
            if (e.code === "Space" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
                e.preventDefault();
                this.handleVoiceToggle();
            }
        });

        V.logEvent("VOICE_SESSION_STARTED", { mode: "ChatGPT Real-Time Architecture Initialized" });
    },

    async handleVoiceToggle() {
        // 1. If currently speaking -> instant barge-in (interruption) (never use buggy speechSynthesis.speaking)
        const isSpeaking = Boolean(
            (window.speechSynthesisWrapper && window.speechSynthesisWrapper.isPlaying) ||
            (window.V && window.V.isSpeaking) ||
            (window.V && window.V.voice && window.V.voice.speaking)
        );

        if (isSpeaking) {
            if (window.speechSynthesisWrapper) {
                window.speechSynthesisWrapper.bargeIn();
            }
            if (window.speechSynthesis) {
                try { window.speechSynthesis.cancel(); } catch(e) {}
            }
            if (window.streamingSpeechRecognition && !window.streamingSpeechRecognition.isContinuous) {
                window.streamingSpeechRecognition.startContinuous();
            }
            return;
        }

        // 2. If already listening continuous -> pause
        if (window.streamingSpeechRecognition && window.streamingSpeechRecognition.isContinuous) {
            window.streamingSpeechRecognition.stopContinuous();
            return;
        }

        // 3. Otherwise, open panel and start real-time conversational mode immediately
        if (window.V) {
            window.V.enabled = true;
            if (window.V.voice) window.V.voice.enabled = true;
        }
        if (window.openPanel) window.openPanel();
        if (window.streamingSpeechRecognition) {
            await window.streamingSpeechRecognition.startContinuous();
        }
    },

    async cancelCurrentFlow() {
        if (V.voiceSession) {
            V.voiceSession.cancelled = true;
            V.voiceSession.active = false;
        }
        if (window.speechSynthesisWrapper) {
            window.speechSynthesisWrapper.bargeIn();
        }
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch(e) {}
        }
        if (window.streamingSpeechRecognition) {
            window.streamingSpeechRecognition.stopContinuous();
        }
        V.voice.state = VOICE_STATES.IDLE;
        if (window.setVoiceStatus) {
            window.setVoiceStatus("Voice assistant idle.");
        }
    },

    async scanAndReadPage(page) {
        if (window.pageTools) {
            const summary = window.pageTools.getSpokenSummary(page);
            if (summary && !V.voiceSession.cancelled) {
                speak(summary);
            }
        }
    },

    async startPageFlow(page) {
        if (V && V.voiceSession) {
            V.voiceSession.cancelled = false;
        }
        if (window.openPanel) window.openPanel();
        if (window.startListening) window.startListening();
    },

    /**
     * Standard Question & Answer interaction
     */
    async askQuestion(questionText) {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            if (V.voiceSession.cancelled) return null;

            await speak(questionText);
            if (V.voiceSession.cancelled) return null;

            const response = await listen();
            if (V.voiceSession.cancelled) return null;

            if (response.error) {
                return null;
            }

            if (!response.text || response.text.trim().length === 0) {
                attempts++;
                if (attempts < maxAttempts && !V.voiceSession.cancelled) {
                    await speak("I didn't quite catch that. Could you please repeat?");
                }
                continue;
            }

            const intentObj = detectIntent(response.text);

            // Process Global Commands First
            const isGlobal = await handleGlobalVoiceCommand(intentObj);
            if (isGlobal) {
                if (intentObj.intent === "STOP" || intentObj.intent === "CANCEL") {
                    return null;
                }
                if (V.voiceSession.cancelled) return null;
                continue;
            }

            return intentObj;
        }

        await speak("Let's pause voice input for now.");
        await this.cancelCurrentFlow();
        return null;
    }
};

// Initialize on load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => voiceAssistant.init());
} else {
    voiceAssistant.init();
}

window.voiceAssistant = voiceAssistant;

window.promptBlindUserCheck = window.promptBlindUserCheck || function() {
    const modal = document.getElementById('blind-check-modal');
    if (modal) modal.style.display = 'flex';
    if (window.V) {
        window.V.blindCheckActive = true;
        window.V.enabled = true;
        if (window.V.voice) {
            window.V.voice.blindCheckActive = true;
            window.V.voice.enabled = true;
        }
    }
};

window.confirmBlindUser = window.confirmBlindUser || async function(isBlind) {
    const modal = document.getElementById('blind-check-modal');
    if (modal) modal.style.display = 'none';

    if (window.V) {
        window.V.blindCheckActive = false;
        if (window.V.voice) window.V.voice.blindCheckActive = false;
    }

    const banner = document.getElementById('accessible-welcome-banner');

    if (isBlind) {
        if (window.V) {
            window.V.isBlindUser = true;
            window.V.enabled = true;
            window.V.handsFree = true;
            window.V.continuousListening = true;
            if (window.V.voice) {
                window.V.voice.isBlindUser = true;
                window.V.voice.enabled = true;
                window.V.voice.blindMode = true;
            }
        }
        try { localStorage.setItem('skillnexus_blind_mode', 'yes'); } catch(e){}

        if (banner) banner.style.display = 'flex';
        if (window.openPanel) window.openPanel();
        if (window.startListening) window.startListening();

        const welcome = 'Voice assistant is now enabled for you. You can interact completely through voice without clicking. To check your skill gap analysis, say: Analyze my skills. Or state your dream job, like: My dream job is Data Analyst. What would you like to do?';
        if (window.speak) {
            await window.speak(welcome);
            if (window.guidedWorkflow) {
                setTimeout(() => {
                    window.guidedWorkflow();
                }, 500);
            }
        }
    } else {
        if (window.V) {
            window.V.isBlindUser = false;
            window.V.enabled = true;
            window.V.handsFree = false;
            window.V.continuousListening = false;
            if (window.V.voice) {
                window.V.voice.isBlindUser = false;
                window.V.voice.enabled = true;
                window.V.voice.blindMode = false;
            }
        }
        try { localStorage.setItem('skillnexus_blind_mode', 'no'); } catch(e){}

        if (banner) banner.style.display = 'none';
        if (window.closePanel) window.closePanel();
        const visualWelcome = 'Welcome to SkillNexus AI. You are in standard visual mode. Click the microphone anytime you want to speak.';
        if (window.speak) {
            await window.speak(visualWelcome);
            if (window.guidedWorkflow) {
                setTimeout(() => {
                    window.guidedWorkflow();
                }, 500);
            }
        }
    }
};

window.setVoicePersona = function(personaId) {
    if (!personaId) return;
    try {
        localStorage.setItem('voicePersona', personaId);
    } catch(e) {}
    if (window.supertonicTTS) {
        window.supertonicTTS.setVoice(personaId);
    }
    const selectEl = document.getElementById('voice-persona');
    if (selectEl && selectEl.value !== personaId) {
        selectEl.value = personaId;
    }
    const statusEl = document.getElementById('voice-model-status');
    if (statusEl) {
        if (personaId === "native") {
            statusEl.style.display = "block";
            statusEl.innerHTML = "Standard browser voice active.";
            setTimeout(() => { statusEl.style.display = "none"; }, 2500);
        } else {
            statusEl.style.display = "block";
            statusEl.innerHTML = `Selected Persona: ${personaId}`;
            setTimeout(() => { statusEl.style.display = "none"; }, 2500);
        }
    }
};

// Sync voice persona selector on load
if (typeof document !== "undefined") {
    const syncPersona = () => {
        const saved = localStorage.getItem('voicePersona') || 'native';
        const selectEl = document.getElementById('voice-persona');
        if (selectEl) selectEl.value = saved;
        if (window.supertonicTTS) window.supertonicTTS.setVoice(saved);
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", syncPersona);
    } else {
        syncPersona();
    }
}

