/**
 * Global state & Observability for the Voice Assistant
 */
window.V = window.V || {};

const VOICE_STATES = {
    IDLE: "IDLE",
    LISTENING: "LISTENING",
    PROCESSING: "PROCESSING",
    THINKING: "THINKING",
    SPEAKING: "SPEAKING",
    WAITING_CONFIRMATION: "WAITING_CONFIRMATION",
    ERROR: "ERROR"
};
window.VOICE_STATES = VOICE_STATES;

V.voice = {
    enabled: true,
    state: VOICE_STATES.IDLE,
    currentPage: null,
    listening: false,
    speaking: false,
    processing: false,
    lastSpokenText: "",
    retryCount: 0,
    blindMode: null,
    blindCheckActive: false,
    isBlindUser: false
};

V.voiceSession = {
    active: false,
    flowName: null,
    step: null,
    data: {},
    cancelled: false,
    lastAction: null,
    pendingConfirmation: null,
    taskContext: null
};

// Observability Logger (CRITICAL: Never logs passwords, API keys, or sensitive credentials)
V.logEvent = function(eventType, payload = {}) {
    const timestamp = new Date().toISOString();
    // Deep clone and sanitize
    const sanitized = JSON.parse(JSON.stringify(payload, (key, value) => {
        if (/pass|secret|token|cred|auth|key/i.test(key)) {
            return "[REDACTED]";
        }
        return value;
    }));

    if (window.console && console.log) {
        console.log(`%c[VOICE:${eventType}]%c ${timestamp}`, "color:#7c3aed;font-weight:bold", "color:#888", sanitized);
    }
};

window.V = V;
