/**
 * CONVERSATION ORCHESTRATOR
 * Integrates: Context Manager, Intent Detection, Memory Manager, Tool Router,
 * Confirmation Manager, and Response Controller.
 */
class ConversationOrchestrator {
    constructor() {
        // Sub-managers
        this.contextManager = {
            getCurrentPage: () => window.pageTools ? window.pageTools.getCurrentPageId() : "landing",
            getPageContext: () => window.pageTools ? window.pageTools.scanPage() : {},
            getAuthStatus: () => window.authTools ? window.authTools.checkAuth() : { isAuthenticated: false }
        };

        this.memoryManager = window.memoryStore || null;
        this.toolRouter = window.toolRegistry || null;
        this.responsePlanner = window.responsePlanner || null;

        this.pendingConfirmation = null;
        this.isProcessing = false;
    }

    /**
     * Primary entry point when a completed speech turn is received from VAD / Turn Detector
     */
    async processUserTurn(audioBlob) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        if (window.setVoiceStatus) {
            window.setVoiceStatus("Transcribing speech...");
        }
        if (window.V && window.V.voice) {
            window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.PROCESSING : "PROCESSING";
        }

        try {
            window.lastAudioBlob = audioBlob;

            // 1. STREAMING STT (Speech → Text)
            const formData = new FormData();
            formData.append("audio", audioBlob, "turn.webm");

            const sttRes = await fetch("/api/stt", {
                method: "POST",
                body: formData
            });

            if (!sttRes.ok) {
                throw new Error(`STT failed with status ${sttRes.status}`);
            }

            const sttData = await sttRes.json();
            const transcript = sttData.text ? sttData.text.trim() : "";

            if (window.V && window.V.logEvent) {
                window.V.logEvent("STT_COMPLETED", { transcript });
            }

            if (!transcript) {
                this.isProcessing = false;
                if (window.V && window.V.voice) window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.IDLE : "IDLE";
                if (window.turnDetector) window.turnDetector.reset();
                return;
            }

            // Self-Speech / Acoustic Echo Filter: reject if transcript echoes recent assistant speech
            if (window.isRecentSpeech && window.isRecentSpeech(transcript)) {
                console.log("🔇 [ConversationOrchestrator] Rejected echo transcript from TurnDetector:", transcript);
                this.isProcessing = false;
                if (window.V && window.V.voice) window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.IDLE : "IDLE";
                if (window.turnDetector) window.turnDetector.reset();
                return;
            }

            // High priority: Blind Check instant bypass
            const isBlindCheck = Boolean(
                (window.V && (window.V.blindCheckActive || (window.V.voice && window.V.voice.blindCheckActive))) ||
                (document.getElementById("blind-check-modal") && document.getElementById("blind-check-modal").style.display !== "none")
            );
            if (isBlindCheck) {
                const intent = window.detectIntent ? window.detectIntent(transcript) : { intent: "ANSWER", text: transcript };
                if (intent.intent === "YES" || intent.intent === "NO") {
                    if (window.handleGlobalVoiceCommand) {
                        await window.handleGlobalVoiceCommand(intent);
                        return;
                    }
                }
            }

            await this.processTranscript(transcript);

        } catch (err) {
            console.error("Error in Conversation Orchestrator:", err);
            if (window.V && window.V.logEvent) {
                window.V.logEvent("ERROR", { context: "Orchestrator", error: err.message });
            }
            await this.speakResponse("Sorry, I had trouble processing that. Please try again.");
        } finally {
            this.isProcessing = false;
            if (window.V && window.V.voice) window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.IDLE : "IDLE";
            if (window.turnDetector) window.turnDetector.reset();
        }
    }

    /**
     * Entry point for text turns (from Web Speech API or chat inputs)
     */
    async processTextTurn(transcript) {
        if (!transcript || !transcript.trim()) return;
        const clean = transcript.trim();

        // Self-Speech / Acoustic Echo Filter: reject if text turn echoes recent assistant speech
        if (window.isRecentSpeech && window.isRecentSpeech(clean)) {
            console.log("🔇 [ConversationOrchestrator] Rejected echo text turn:", clean);
            return;
        }

        // High priority: Blind Check instant bypass - never let isProcessing block Yes/No!
        const isBlindCheckActive = Boolean(
            (window.V && (window.V.blindCheckActive || (window.V.voice && window.V.voice.blindCheckActive))) ||
            (document.getElementById("blind-check-modal") && document.getElementById("blind-check-modal").style.display !== "none")
        );
        if (isBlindCheckActive) {
            const intentObj = window.detectIntent ? window.detectIntent(clean) : { intent: "ANSWER", text: clean };
            if (intentObj.intent === "YES" || intentObj.intent === "NO") {
                if (window.handleGlobalVoiceCommand) {
                    await window.handleGlobalVoiceCommand(intentObj);
                    return;
                }
            }
        }

        // Turn Deduplication Filter: reject identical text turn within 2.0 seconds
        const now = Date.now();
        if (this.lastProcessedTurnText === clean && (now - (this.lastProcessedTurnTime || 0) < 2000)) {
            console.log("🔇 [ConversationOrchestrator] Rejected duplicate text turn:", clean);
            return;
        }
        this.lastProcessedTurnText = clean;
        this.lastProcessedTurnTime = now;

        if (this.isProcessing) return;
        this.isProcessing = true;
        try {
            await this.processTranscript(clean);
        } catch (err) {
            console.error("Error processing text turn:", err);
        } finally {
            this.isProcessing = false;
            if (window.V && window.V.voice) window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.IDLE : "IDLE";
            if (window.turnDetector) window.turnDetector.reset();
        }
    }

    async processTranscript(transcript) {
        if (!transcript || !transcript.trim()) return;
        const cleanText = transcript.trim();

        if (window.setVoiceStatus) {
            window.setVoiceStatus(`You: "${cleanText}"`);
        }

        // Record turn in Memory Store
        if (this.memoryManager) {
            this.memoryManager.addTurn("user", cleanText);
        }

        // 2. INTENT DETECTION & PRIORITY COMMANDS
        const intentObj = window.detectIntent ? window.detectIntent(cleanText) : { intent: "ANSWER", text: cleanText };
        
        // Check blind accessibility check first
        const isBlindCheckActive = Boolean(
            (window.V && (window.V.blindCheckActive || (window.V.voice && window.V.voice.blindCheckActive))) ||
            (document.getElementById("blind-check-modal") && document.getElementById("blind-check-modal").style.display !== "none")
        );
        if (isBlindCheckActive && window.handleGlobalVoiceCommand) {
            const handledBlind = await window.handleGlobalVoiceCommand(intentObj);
            if (handledBlind) return;
        }

        // Check global commands (Stop, Repeat, Back, Help, Logout)
        if (intentObj.intent !== "ANSWER") {
            const handledGlobal = await window.handleGlobalVoiceCommand(intentObj);
            if (handledGlobal) {
                return;
            }
        }

        // Check if we are awaiting a confirmation
        if (this.pendingConfirmation) {
            await this.handleConfirmationResponse(intentObj);
            return;
        }

        // Route to active app-level flow (biometric modal, login flow, course flow, or custom command)
        const tLower = cleanText.toLowerCase();
        const hasActiveFlow = Boolean(
            (window.V && window.V.voiceBioFlow && window.V.voiceBioFlow.active) ||
            (window.V && window.V.loginFlow && window.V.loginFlow.active) ||
            (window.V && window.V.courseFlow && window.V.courseFlow.active) ||
            (window.V && window.V.analysisFlow && window.V.analysisFlow.active) ||
            (window.V && window.V.dreamFlow && window.V.dreamFlow.active) ||
            (window.V && window.V.interest && window.V.interest.active)
        );

        const isAppSpecificKeyword = Boolean(
            tLower.includes("voice login") || tLower.includes("biometric") || tLower.includes("enroll") ||
            tLower.startsWith("hi i am") || tLower.startsWith("my name is") ||
            tLower.includes("analyze my skills") || tLower.includes("analyse my skills") ||
            tLower.includes("my dream job is") || tLower.includes("find a dream job") ||
            tLower.includes("read results") || tLower.includes("read roadmap") || tLower.includes("read courses") ||
            tLower.includes("show my roadmap") || tLower.includes("open course")
        );

        if ((hasActiveFlow || isAppSpecificKeyword) && window.handleVoiceCommand) {
            window.handleVoiceCommand(cleanText);
            return;
        }

        // 3. LLM BRAIN (Structured Intent Reasoning)
        if (window.setVoiceStatus) window.setVoiceStatus("Thinking...");
        if (window.V && window.V.voice) {
            window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.THINKING : "THINKING";
        }

        let decision = null;
        if (window.llmProvider) {
            decision = await window.llmProvider.decideAction(cleanText);
        }

        // 4. CONFIRMATION MANAGER
        if (decision && decision.requiresConfirmation) {
            this.pendingConfirmation = {
                action: decision.action,
                arguments: decision.arguments,
                spokenResponse: decision.spokenResponse
            };
            if (window.V && window.V.voice) {
                window.V.voice.state = window.VOICE_STATES ? window.VOICE_STATES.WAITING_CONFIRMATION : "WAITING_CONFIRMATION";
            }
            const prompt = decision.spokenResponse 
                ? `${decision.spokenResponse} Should I proceed?`
                : "Shall I execute this action?";
            
            await this.speakResponse(prompt);
            return;
        }

        // 5. TOOL ROUTER - Strictly gate actions to explicit user commands only
        let toolResult = null;
        if (decision && decision.action && decision.action !== "none") {
            const isExplicitNav = /^(go to|navigate to|take me to|switch to|open|view|show)\s+(dashboard|login|signup|roadmap|courses|profile|progress|about|home|results|analysis)/i.test(cleanText) ||
                                  /^(go home|go back|previous page)$/i.test(cleanText);
            const isExplicitNext = /^(next|next page|go next|go to next page|switch to next page|continue|proceed|forward)$/i.test(cleanText);
            const isExplicitPrev = /^(previous|previous page|go back|back|go to previous page|switch to previous page)$/i.test(cleanText);
            const isExplicitLogin = /^(go to login|open login|navigate to login|show login screen|open sign in|go to sign in|voice login|login with voice|login|log in|sign in)$/i.test(cleanText);
            const isExplicitGoogle = /^(continue with google|google login|login with google|sign in with google|signup with google|sign up with google)$/i.test(cleanText);
            const isExplicitFill = /^(set my dream job to|set dream job to|my dream job is|my skills are|add skill|set hours to|hours are)\s+/i.test(cleanText);
            const isExplicitSubmit = /^(submit|analyze my skills|run analysis|submit analysis)$/i.test(cleanText);

            let allowExecution = false;
            if (decision.action === "navigate" && isExplicitNav) allowExecution = true;
            else if (decision.action === "next_page" && isExplicitNext) allowExecution = true;
            else if (decision.action === "previous_page" && isExplicitPrev) allowExecution = true;
            else if (decision.action === "login" && isExplicitLogin) allowExecution = true;
            else if (decision.action === "google_login" && isExplicitGoogle) allowExecution = true;
            else if ((decision.action === "fill_field" || decision.action === "add_skill" || decision.action === "set_hours") && isExplicitFill) allowExecution = true;
            else if (decision.action === "submit_form" && isExplicitSubmit) allowExecution = true;
            else if (decision.action === "read_page" || decision.action === "get_dashboard_data" || decision.action === "logout" || decision.action === "cancel") allowExecution = true;

            if (allowExecution && this.toolRouter) {
                toolResult = await this.toolRouter.execute(decision.action, decision.arguments || {});
            } else if (!allowExecution && decision.action !== "none") {
                console.log(`🛡️ [ActionGating] Blocked non-explicit action "${decision.action}" for speech: "${cleanText}"`);
            }
        }

        // 6. RESPONSE PLANNER (avoid double announcement if tool already spoke)
        const isNavAction = decision && ["navigate", "next_page", "previous_page", "login"].includes(decision.action);
        if (isNavAction && toolResult && toolResult.success) {
            return; // Navigation announcement was already cleanly delivered by navigationTools
        }

        const plan = this.responsePlanner 
            ? this.responsePlanner.planResponse(decision, toolResult)
            : { fullText: decision?.spokenResponse || toolResult?.message || "Understood." };

        // 7. STREAMING TTS & AUDIO PLAYBACK
        await this.speakResponse(plan.fullText);

        // Save assistant turn
        if (this.memoryManager && plan.fullText) {
            this.memoryManager.addTurn("assistant", plan.fullText);
        }
    }

    async handleConfirmationResponse(intentObj) {
        const pending = this.pendingConfirmation;
        this.pendingConfirmation = null;

        if (intentObj.intent === "YES") {
            if (this.toolRouter && pending.action) {
                const toolResult = await this.toolRouter.execute(pending.action, pending.arguments || {});
                await this.speakResponse(toolResult?.message || "Action completed.");
            }
        } else {
            await this.speakResponse("Action cancelled.");
        }
    }

    async speakResponse(text) {
        if (!text) return;
        if (window.speak) {
            await window.speak(text);
        }
    }
}

window.conversationOrchestrator = new ConversationOrchestrator();
