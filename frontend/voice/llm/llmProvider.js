/**
 * LLM Provider Client
 * Connects frontend voice controller to backend structured intent reasoning endpoint.
 * Fallback to local rule engine when offline or disconnected.
 */
class LLMProvider {
    async decideAction(userSpeech) {
        if (!userSpeech || !userSpeech.trim()) {
            return {
                intent: "UNKNOWN",
                action: "none",
                arguments: {},
                spokenResponse: "I didn't hear anything.",
                requiresConfirmation: false
            };
        }

        const currentPage = window.pageTools ? window.pageTools.getCurrentPageId() : "landing";
        const pageContext = window.pageTools ? window.pageTools.scanPage(currentPage) : {};
        const sessionContext = window.conversationContext ? window.conversationContext.getSummary() : {};

        V.logEvent("INTENT_DETECTED", { userSpeech, currentPage });

        // 1. ULTRA-FAST LOCAL PATH: Resolve common commands in 0ms without waiting for cloud round-trip
        const local = this.fallbackLocalIntent(userSpeech, currentPage);
        if (local && local.intent !== "CONVERSATION") {
            return local;
        }

        // 1b. If offline, return local intent IMMEDIATELY (0ms, no network delay)
        if (!navigator.onLine) {
            console.log("[LLMProvider] Offline mode active: returning local reasoning instantly.");
            return local;
        }

        // 2. Open-ended conversational or complex query: query backend LLM with strict 1200ms timeout
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);

            const response = await fetch("/api/voice/intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    speech: userSpeech,
                    currentPage,
                    pageContext,
                    sessionContext
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Intent API status: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.intent && data.action) {
                return data;
            }
            throw new Error("Invalid format from intent API");
        } catch (err) {
            console.warn("LLM intent API timed out or unavailable, using local fast-path:", err.message);
            return local || {
                intent: "CONVERSATION",
                action: "none",
                arguments: {},
                spokenResponse: "I am listening. Say 'help' for commands, or tell me your dream job.",
                requiresConfirmation: false
            };
        }
    }

    fallbackLocalIntent(speech, currentPage) {
        const t = speech.toLowerCase().trim();

        // Affirmations (including elongated "yeahh", "yess", "yup", etc.)
        if (/^(y+(e+s+|e+a+h*|e+p*|u+p*|a+)|sure|correct|confirm|proceed|ok|okay|do it|true|enable)$/i.test(t)) {
            return {
                intent: "YES",
                action: "none",
                arguments: {},
                spokenResponse: "Understood. How can I help you next?",
                requiresConfirmation: false
            };
        }

        // Negations (including "noo", "nope", "nahh")
        if (/^(n+o+|n+o+p+e*|n+a+h*|cancel|stop)$/i.test(t)) {
            return {
                intent: "NO",
                action: "cancel",
                arguments: {},
                spokenResponse: "Action cancelled.",
                requiresConfirmation: false
            };
        }

        // Greetings
        if (/^(hi|hello|hey|good morning|good afternoon|good evening|hey there|greetings)$/i.test(t)) {
            return {
                intent: "GREETING",
                action: "none",
                arguments: {},
                spokenResponse: "Hello! I am SkillNexus AI. You can ask me to analyze your skills, show your roadmap, or log in.",
                requiresConfirmation: false
            };
        }

        // Identity & Who are you
        if (t.includes("who are you") || t.includes("what is your name") || t.includes("your name") || t.includes("who made you") || t.includes("who created you")) {
            return {
                intent: "IDENTITY",
                action: "none",
                arguments: {},
                spokenResponse: "I am SkillNexus AI, your voice assistant. I help you discover and bridge your career skill gaps.",
                requiresConfirmation: false
            };
        }

        // How are you
        if (t.includes("how are you") || t.includes("how are things") || t.includes("how is it going")) {
            return {
                intent: "HOW_ARE_YOU",
                action: "none",
                arguments: {},
                spokenResponse: "I am doing great and ready to help you analyze your skills and level up your career!",
                requiresConfirmation: false
            };
        }

        // Gratitude
        if (t.includes("thank you") || t.includes("thanks") || t === "thank u") {
            return {
                intent: "GRATITUDE",
                action: "none",
                arguments: {},
                spokenResponse: "You're very welcome! Feel free to ask anytime if you want to explore courses or roadmaps.",
                requiresConfirmation: false
            };
        }

        // Platform info / What is this website
        if (t.includes("what is this") || t.includes("what does this website do") || t.includes("what is skill nexus") || t.includes("what is skill gap")) {
            return {
                intent: "INFO",
                action: "none",
                arguments: {},
                spokenResponse: "SkillNexus AI analyzes your existing skills against your dream job requirements, finds the gaps, and recommends courses and roadmaps.",
                requiresConfirmation: false
            };
        }

        // Help
        if (/^(help|commands|what can you do|what should i do|how to use|features)$/i.test(t)) {
            return {
                intent: "HELP",
                action: "none",
                arguments: {},
                spokenResponse: "You can say: analyze my skills, go to login, show my roadmap, read courses, or set your dream job.",
                requiresConfirmation: false
            };
        }

        // Login shortcuts
        if (/^(login|log in|sign in|go to login|open login|show login screen)$/i.test(t)) {
            return {
                intent: "LOGIN",
                action: "login",
                arguments: {},
                spokenResponse: "Taking you to the login screen.",
                requiresConfirmation: false
            };
        }

        if (t.includes("continue with google") || t.includes("google login") || t === "login with google") {
            return {
                intent: "LOGIN_GOOGLE",
                action: "google_login",
                arguments: {},
                spokenResponse: "Continuing with Google.",
                requiresConfirmation: false
            };
        }

        // Navigation shortcuts
        if (/^(next|next page|go next|go to next page|switch to next page|continue|proceed|forward)$/i.test(t)) {
            return {
                intent: "NEXT_PAGE",
                action: "next_page",
                arguments: {},
                spokenResponse: "Switching to next page.",
                requiresConfirmation: false
            };
        }

        if (/^(previous|previous page|go back|back|go to previous page|switch to previous page)$/i.test(t)) {
            return {
                intent: "BACK",
                action: "previous_page",
                arguments: {},
                spokenResponse: "Going to previous page.",
                requiresConfirmation: false
            };
        }

        // Specific screens
        const isNavCommand = /^(go to|open|navigate to|show|view|switch to|take me to)\s+/i.test(t);

        if (isNavCommand || t === "go home" || t === "go to dashboard" || t === "dashboard") {
            if (t.includes("login") || t.includes("sign in")) {
                return {
                    intent: "LOGIN",
                    action: "login",
                    arguments: {},
                    spokenResponse: "Taking you to the login screen.",
                    requiresConfirmation: false
                };
            }
            if (t.includes("dashboard") || t.includes("analysis") || t.includes("home")) {
                return {
                    intent: "NAVIGATE",
                    action: "navigate",
                    arguments: { page: "analyse" },
                    spokenResponse: "Going to the Skill Analysis dashboard.",
                    requiresConfirmation: false
                };
            }
            if (t.includes("result") || t.includes("score")) {
                return {
                    intent: "NAVIGATE",
                    action: "navigate",
                    arguments: { page: "results" },
                    spokenResponse: "Opening your results.",
                    requiresConfirmation: false
                };
            }
            if (t.includes("course")) {
                return {
                    intent: "NAVIGATE",
                    action: "navigate",
                    arguments: { page: "courses" },
                    spokenResponse: "Opening course recommendations.",
                    requiresConfirmation: false
                };
            }
            if (t.includes("roadmap")) {
                return {
                    intent: "NAVIGATE",
                    action: "navigate",
                    arguments: { page: "roadmap" },
                    spokenResponse: "Opening your learning roadmap.",
                    requiresConfirmation: false
                };
            }
            if (t.includes("profile")) {
                return {
                    intent: "NAVIGATE",
                    action: "navigate",
                    arguments: { page: "profile" },
                    spokenResponse: "Opening your profile.",
                    requiresConfirmation: false
                };
            }
            if (t.includes("progress")) {
                return {
                    intent: "NAVIGATE",
                    action: "navigate",
                    arguments: { page: "progress" },
                    spokenResponse: "Opening your progress.",
                    requiresConfirmation: false
                };
            }
        }

        if (t.includes("read this page") || t.includes("read page") || t.includes("what is on this page")) {
            return {
                intent: "READ_PAGE",
                action: "read_page",
                arguments: {},
                spokenResponse: "Reading page contents.",
                requiresConfirmation: false
            };
        }

        if (t.includes("logout") || t.includes("sign out")) {
            return {
                intent: "LOGOUT",
                action: "logout",
                arguments: {},
                spokenResponse: "Logging you out.",
                requiresConfirmation: false
            };
        }

        if (/^(analyze my skills|analyse my skills|start analysis|run analysis)$/i.test(t)) {
            return {
                intent: "SUBMIT",
                action: "submit_form",
                arguments: { form: "analyse" },
                spokenResponse: "Analyzing your skills now.",
                requiresConfirmation: false
            };
        }

        return {
            intent: "CONVERSATION",
            action: "none",
            arguments: {},
            spokenResponse: "I am ready. You can ask me to navigate, set your career goals, read the page, or log in.",
            requiresConfirmation: false
        };
    }
}

window.llmProvider = new LLMProvider();
