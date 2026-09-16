/**
 * Response Planner
 * Plans conversational responses from LLM reasoning and tool execution results,
 * splitting outputs into natural sentence units for smooth streaming audio playback.
 */
class ResponsePlanner {
    planResponse(llmDecision, toolResult = null) {
        let baseText = "";

        if (llmDecision && llmDecision.spokenResponse) {
            baseText = llmDecision.spokenResponse;
        } else if (toolResult && toolResult.message) {
            baseText = toolResult.message;
        } else {
            baseText = "Done.";
        }

        // Clean any residual markdown formatting or symbols
        baseText = this.sanitizeSpokenText(baseText);

        // Split into natural sentence chunks for streaming audio
        const chunks = this.splitIntoSentences(baseText);

        return {
            fullText: baseText,
            sentences: chunks,
            requiresFollowUp: llmDecision?.intent === "ASK_USER",
            actionTaken: llmDecision?.action
        };
    }

    sanitizeSpokenText(text) {
        if (!text) return "";
        let s = text.replace(/[*#_~`\[\]\(\)]/g, ' ');
        s = s.replace(/\s+/g, ' ').trim();
        return s;
    }

    splitIntoSentences(text) {
        if (!text) return [];
        // Split on standard punctuation followed by space or end
        const raw = text.split(/(?<=[.!?])\s+/);
        return raw.filter(s => s && s.trim().length > 0);
    }
}

window.responsePlanner = new ResponsePlanner();
