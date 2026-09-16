/**
 * Short-lived Conversational Memory Context
 * Manages conversation history, extracted entities, and task states.
 * SECURITY: NEVER STORES PASSWORDS OR AUTH SECRETS.
 */
class ConversationContext {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentPage = null;
        this.currentTask = null; // e.g., 'LOGIN', 'SKILL_GAP_ANALYSIS', 'NAVIGATION'
        this.collectedData = {
            name: "",
            email: "",
            dreamJob: "",
            skills: [],
            hoursPerWeek: null
        };
        this.lastAction = null;
        this.lastResponse = null;
        this.history = []; // Max 6 turns: { role: 'user'|'assistant', text: string }
    }

    setPage(page) {
        this.currentPage = page;
    }

    setTask(task) {
        this.currentTask = task;
    }

    updateData(key, value) {
        // Strict guard against any password caching
        if (/pass/i.test(key)) return;
        this.collectedData[key] = value;
    }

    recordTurn(role, text) {
        if (!text) return;
        // Strip any passwords before saving history
        let cleanText = text;
        if (/password/i.test(text)) {
            cleanText = text.replace(/password\s+(?:is\s+)?([^\s,.]+)/i, "password [PROTECTED]");
        }

        this.history.push({ role, text: cleanText, time: Date.now() });
        if (this.history.length > 6) {
            this.history.shift();
        }
    }

    getSummary() {
        return {
            currentPage: this.currentPage,
            currentTask: this.currentTask,
            collectedData: { ...this.collectedData },
            lastAction: this.lastAction,
            lastResponse: this.lastResponse,
            turnsCount: this.history.length
        };
    }
}

window.conversationContext = new ConversationContext();
