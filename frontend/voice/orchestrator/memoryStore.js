/**
 * Memory Store
 * Manages short-term conversational session memory and long-term user profile preferences.
 * SECURITY: NEVER PERSISTS PASSWORDS OR SENSITIVE CREDENTIALS.
 */
class MemoryStore {
    constructor() {
        this.sessionTurns = [];
        this.sessionEntities = {
            dreamJob: "",
            skills: [],
            hoursPerWeek: null,
            email: ""
        };
        this.storageKey = "skillnexus_voice_memory";
        this.loadPersistentMemory();
    }

    loadPersistentMemory() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const data = JSON.parse(raw);
                if (data && typeof data === 'object') {
                    // Prepopulate known preferences (excluding sensitive info)
                    if (data.dreamJob) this.sessionEntities.dreamJob = data.dreamJob;
                    if (Array.isArray(data.skills)) this.sessionEntities.skills = [...data.skills];
                    if (data.hoursPerWeek) this.sessionEntities.hoursPerWeek = data.hoursPerWeek;
                }
            }
        } catch (e) {
            console.warn("Could not load persistent voice memory:", e);
        }
    }

    savePersistentMemory() {
        try {
            const toSave = {
                dreamJob: this.sessionEntities.dreamJob,
                skills: this.sessionEntities.skills,
                hoursPerWeek: this.sessionEntities.hoursPerWeek,
                lastUpdated: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(toSave));
        } catch (e) {
            console.warn("Could not save persistent voice memory:", e);
        }
    }

    setEntity(key, value) {
        if (/pass|secret|token/i.test(key)) return; // Strict guard
        this.sessionEntities[key] = value;
        this.savePersistentMemory();
    }

    getEntity(key) {
        return this.sessionEntities[key];
    }

    addTurn(role, text) {
        if (!text) return;
        // Scrub password phrases before storing turn
        const scrubbed = text.replace(/password\s+(?:is\s+)?([^\s,.]+)/i, "password [PROTECTED]");
        this.sessionTurns.push({ role, text: scrubbed, timestamp: Date.now() });

        if (this.sessionTurns.length > 8) {
            this.sessionTurns.shift();
        }
    }

    getHistory() {
        return [...this.sessionTurns];
    }

    clearSession() {
        this.sessionTurns = [];
    }

    getSnapshot() {
        return {
            entities: { ...this.sessionEntities },
            turns: [...this.sessionTurns]
        };
    }
}

window.memoryStore = new MemoryStore();
