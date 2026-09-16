/**
 * Intent Mapping and Instant Global Voice Commands
 * Handles priority control keywords without waiting for LLM round-trip.
 */

function detectIntent(text) {
    if (!text) return { intent: "UNKNOWN", text: "" };
    
    const cleanT = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const t = cleanT;
    const words = cleanT.split(' ');

    // 1. Immediate cancellation & stop
    if (cleanT === "stop" || cleanT === "cancel" || cleanT === "abort" || cleanT === "exit" || cleanT === "shut up" ||
        cleanT === "stop the video" || cleanT === "stop video" || cleanT === "pause" || cleanT === "pause video") {
        return { intent: "STOP", text: text };
    }

    // 1b. YouTube Voice Search Commands
    const ytMatch = cleanT.match(/(?:go\s+to\s+youtube\s+and\s+(?:find|search)\s+(?:a\s+)?video\s+(?:on|about|for)|search\s+youtube\s+for|find\s+(?:a\s+)?video\s+(?:on|about|for)|search\s+(?:a\s+)?video\s+(?:on|about|for)|look\s+up\s+a\s+video\s+(?:on|about|for)|watch\s+(?:a\s+)?video\s+(?:on|about|for)|youtube\s+search\s+for|youtube\s+search)\s+(.+)/i);
    if (ytMatch) {
        return { intent: "SEARCH_YOUTUBE", text: text, topic: ytMatch[1].trim() };
    }

    if (cleanT === "go to youtube" || cleanT === "open youtube" || cleanT === "youtube") {
        return { intent: "SEARCH_YOUTUBE", text: text, topic: null };
    }

    // 1c. Play / Click Result Commands
    if (cleanT === "play that" || cleanT === "play the first one" || cleanT === "play first one" ||
        cleanT === "play the first video" || cleanT === "play that video" || cleanT === "play course" ||
        cleanT === "play that course" || cleanT === "click on that course" || cleanT === "click on the first one" ||
        cleanT === "click on that" || cleanT === "click that") {
        return { intent: "PLAY_RESULT", text: text };
    }

    const clickMatch = cleanT.match(/(?:click\s+on|click|play|open)\s+(?:the\s+)?(.+)/i);
    const navTargets = ['login', 'signup', 'sign up', 'sign in', 'courses', 'course', 'roadmap', 'dashboard', 'profile', 'progress', 'about', 'home', 'settings'];
    if (clickMatch && !cleanT.includes("youtube") && !cleanT.includes("voice") && !cleanT.includes("google")) {
        const target = clickMatch[1].trim();
        if (target && target !== "that" && target !== "it" && !navTargets.includes(target)) {
            return { intent: "PLAY_RESULT", text: text, label: target };
        }
    }

    // 2. Direct voice enable / disable commands
    if (cleanT.includes("enable voice") || cleanT.includes("turn on voice") || cleanT.includes("start voice assistant") || 
        cleanT.includes("activate voice") || cleanT === "voice on" || cleanT === "enable assistant") {
        return { intent: "ENABLE_VOICE", text: text };
    }

    if (cleanT.includes("disable voice") || cleanT.includes("turn off voice") || cleanT.includes("stop voice assistant") || 
        cleanT.includes("deactivate voice") || cleanT === "voice off" || cleanT === "disable assistant") {
        return { intent: "DISABLE_VOICE", text: text };
    }

    // 3. Negations (Blind Check & General Negation) - Evaluate before Affirmations to prevent 'not blind' false positives
    if (/^(n+o+|n+o+p+e*|n+a+h*|wrong|cancel that|dont|not blind|n)$/i.test(cleanT) || 
        words.some(w => /^(n+o+|n+o+p+e*|n+a+h*|disable)$/i.test(w)) ||
        cleanT.includes("no not that") || cleanT.includes("not blind") || cleanT.includes("i am not blind") || 
        cleanT.includes("im not blind") || cleanT.includes("no i am not") || cleanT.includes("no thanks") || 
        cleanT.includes("no thank you")) {
        return { intent: "NO", text: text };
    }

    // 4. Affirmations / Confirmations (Blind Check & General Affirmation)
    if (/^(y+(e+s+|e+a+h*|e+p*|u+p*|a+)|sure|correct|confirm|proceed|ok|okay|do it|true|enable|s|y)$/i.test(cleanT) || 
        words.some(w => /^(y+(e+s+|e+a+h*|e+p*|u+p*|a+)|sure|correct|confirm|proceed|ok|okay|true|enable)$/i.test(w)) ||
        cleanT.includes("yes please") || cleanT.includes("that is correct") || cleanT.includes("i am blind") || 
        cleanT.includes("im blind") || cleanT.includes("yes i am") || cleanT.includes("yes blind") || 
        cleanT.includes("visually impaired")) {
        return { intent: "YES", text: text };
    }

    // 5. Repeat
    if (cleanT.includes("repeat") || cleanT.includes("say that again") || cleanT.includes("what did you say")) {
        return { intent: "REPEAT", text: text };
    }

    // 5. Navigation shortcuts & explicit navigation commands
    if (/^(next|next page|go next|go to next page|switch to next page|open next page|continue|proceed|forward)$/i.test(t)) {
        return { intent: "NEXT_PAGE", text: text };
    }

    if (/^(go back|previous page|previous|back|go to previous page|switch to previous page)$/i.test(t)) {
        return { intent: "BACK", text: text };
    }

    if (/^(go to dashboard|open dashboard|go home|open home|take me to dashboard|navigate to dashboard|dashboard)$/i.test(t)) {
        return { intent: "NAVIGATE_HOME", text: text };
    }

    if (/^(go to login|open login|navigate to login|show login screen|open sign in|go to sign in|login|log in|sign in|open sign in screen)$/i.test(t)) {
        return { intent: "NAVIGATE_LOGIN", text: text };
    }

    if (/^(go to signup|open signup|go to sign up|open sign up|navigate to signup|sign up screen)$/i.test(t)) {
        return { intent: "NAVIGATE_SIGNUP", text: text };
    }

    if (/^(go to roadmap|open roadmap|view roadmap|show roadmap|navigate to roadmap)$/i.test(t)) {
        return { intent: "NAVIGATE_ROADMAP", text: text };
    }

    if (/^(go to courses|open courses|view courses|show courses|navigate to courses)$/i.test(t)) {
        return { intent: "NAVIGATE_COURSES", text: text };
    }

    if (/^(go to profile|open profile|view profile|navigate to profile)$/i.test(t)) {
        return { intent: "NAVIGATE_PROFILE", text: text };
    }

    if (/^(go to progress|open progress|view progress|navigate to progress)$/i.test(t)) {
        return { intent: "NAVIGATE_PROGRESS", text: text };
    }

    if (/^(go to about|open about|view about|navigate to about)$/i.test(t)) {
        return { intent: "NAVIGATE_ABOUT", text: text };
    }

    if (t === "logout" || t === "log out" || t === "sign out" || t === "log me out") {
        return { intent: "LOGOUT", text: text };
    }

    // 6. Help
    if (t === "help" || t.includes("what can i say") || t === "commands" || t === "show help") {
        return { intent: "HELP", text: text };
    }

    // 7. Page reading
    if (t.includes("read this page") || t.includes("read page") || t.includes("what is on this page")) {
        return { intent: "READ_PAGE", text: text };
    }

    // 8. Google Login / Continue with Google
    if (t.includes("continue with google") || t.includes("google login") || 
        t.includes("login with google") || t.includes("log in with google") || 
        t.includes("sign in with google") || t.includes("signup with google") ||
        t.includes("sign up with google")) {
        return { intent: "GOOGLE_LOGIN", text: text };
    }

    // 9. Start Guided Workflow
    if (t.includes("start guided") || t.includes("guided workflow") || t.includes("start workflow") || 
        t.includes("begin guided") || t === "guided tour" || t === "start tour") {
        return { intent: "START_GUIDED_WORKFLOW", text: text };
    }

    return { intent: "ANSWER", text: text };
}

async function handleGlobalVoiceCommand(intentObj) {
    const { intent } = intentObj;

    // Highest Priority: Blind User Accessibility Check
    const isBlindCheck = Boolean(
        (window.V && (window.V.blindCheckActive || (window.V.voice && window.V.voice.blindCheckActive))) ||
        (document.getElementById("blind-check-modal") && document.getElementById("blind-check-modal").style.display !== "none")
    );

    if (isBlindCheck) {
        if (intent === "YES") {
            if (window.confirmBlindUser) {
                window.confirmBlindUser(true);
                return true;
            }
        } else if (intent === "NO") {
            if (window.confirmBlindUser) {
                window.confirmBlindUser(false);
                return true;
            }
        }
    }

    if (intent === "ENABLE_VOICE") {
        if (window.confirmBlindUser) {
            window.confirmBlindUser(true);
        } else if (window.setVoiceEnabled) {
            window.setVoiceEnabled(true);
            if (window.speak) window.speak("Voice assistant enabled.");
        }
        return true;
    }

    if (intent === "DISABLE_VOICE") {
        if (window.confirmBlindUser) {
            window.confirmBlindUser(false);
        } else if (window.setVoiceEnabled) {
            window.setVoiceEnabled(false);
            if (window.speak) window.speak("Voice assistant disabled.");
        }
        return true;
    }

    if (intent === "GOOGLE_LOGIN") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.speak) await window.speak("Continuing with Google.");
        if (window.authTools && window.authTools.loginWithGoogle) {
            window.authTools.loginWithGoogle();
        } else {
            const btn = document.getElementById("btn-google-login") || document.querySelector("#screen-login .social-btn");
            if (btn) btn.click();
            else if (window.doLogin) window.doLogin("google");
        }
        return true;
    }

    if (intent === "STOP") {
        if (window.youtubeTools) {
            window.youtubeTools.stop();
        }
        if (window.voiceAssistant) {
            await window.voiceAssistant.cancelCurrentFlow();
        }
        if (window.stopSpeaking) window.stopSpeaking();
        if (window.stopListening) window.stopListening();
        V.logEvent("VOICE_SESSION_CANCELLED", { reason: "User command" });
        return true;
    }

    if (intent === "SEARCH_YOUTUBE") {
        // Anti-clash check: ensure only one flow runs
        if (window.V && window.V.voiceSession && window.V.voiceSession.active && window.V.voiceSession.flowName !== "YOUTUBE_SEARCH") {
            if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        }

        if (window.V && window.V.voiceSession) {
            window.V.voiceSession.active = true;
            window.V.voiceSession.flowName = "YOUTUBE_SEARCH";
            window.V.voiceSession.cancelled = false;
        }

        let topic = intentObj.topic;
        if (!topic && window.conversationContext) {
            topic = window.conversationContext.get("lastTopic") || (window.S && window.S.dreamJob);
        }
        if (!topic && window.S && window.S.dreamJob) {
            topic = window.S.dreamJob;
        }

        if (!topic) {
            await speak("What topic would you like to search for on YouTube?");
            if (window.V && window.V.voiceSession) window.V.voiceSession.active = false;
            return true;
        }

        if (window.conversationContext) {
            window.conversationContext.set("lastTopic", topic);
        }

        await speak(`Searching YouTube for ${topic}.`);
        if (window.V && window.V.voiceSession && window.V.voiceSession.cancelled) return true;

        if (window.toolRegistry) {
            const res = await window.toolRegistry.execute("search_youtube", { query: topic });
            if (res && res.success && res.videoId) {
                await speak(`Found ${res.title}. Playing now.`);
                if (window.V && window.V.voiceSession && window.V.voiceSession.cancelled) return true;
                await window.toolRegistry.execute("play_youtube", { videoId: res.videoId, title: res.title });
            } else {
                await speak(res?.message || `I couldn't find any YouTube videos for ${topic}.`);
            }
        }

        if (window.V && window.V.voiceSession) {
            window.V.voiceSession.active = false;
        }
        return true;
    }

    if (intent === "PLAY_RESULT") {
        const label = intentObj.label ? intentObj.label.toLowerCase().trim() : "";

        // 1. If explicit label provided ("click on X"), resolve deterministically via data-voice-label attribute
        if (label) {
            const matchEl = document.querySelector(`[data-voice-label="${label}"]`) ||
                            document.querySelector(`[data-voice-label*="${label}"]`);
            if (matchEl) {
                // Check if card has a direct YouTube link to play via IFrame
                const ytAnchor = matchEl.querySelector("a[href*='youtube.com']");
                if (ytAnchor && ytAnchor.href && window.toolRegistry) {
                    const vIdMatch = ytAnchor.href.match(/(?:v=|\/embed\/|\/watch\?v=)([a-zA-Z0-9_-]{11})/);
                    if (vIdMatch) {
                        const cardTitle = matchEl.querySelector(".c-name")?.textContent || label;
                        await speak(`Playing ${cardTitle}.`);
                        await window.toolRegistry.execute("play_youtube", { videoId: vIdMatch[1], title: cardTitle });
                        return true;
                    }
                }
                const actionBtn = matchEl.querySelector("button") || matchEl.querySelector("a") || matchEl;
                actionBtn.click();
                await speak(`Selected ${label}.`);
                return true;
            }
        }

        // 2. Otherwise "play that" / "play the first one" / "click on that course"
        const firstCard = document.querySelector(".course-card[data-voice-label]");
        if (firstCard) {
            const cardLabel = firstCard.getAttribute("data-voice-label") || "first course";
            const ytAnchor = firstCard.querySelector("a[href*='youtube.com']");
            if (ytAnchor && ytAnchor.href && window.toolRegistry) {
                const vIdMatch = ytAnchor.href.match(/(?:v=|\/embed\/|\/watch\?v=)([a-zA-Z0-9_-]{11})/);
                if (vIdMatch) {
                    const cardTitle = firstCard.querySelector(".c-name")?.textContent || cardLabel;
                    await speak(`Playing ${cardTitle}.`);
                    await window.toolRegistry.execute("play_youtube", { videoId: vIdMatch[1], title: cardTitle });
                    return true;
                }
            }
            const btn = firstCard.querySelector("button") || firstCard.querySelector("a");
            if (btn) {
                btn.click();
                await speak(`Opening ${cardLabel}.`);
                return true;
            }
        }

        // 3. If there is a last searched topic in context, play it
        const lastTopic = window.conversationContext ? window.conversationContext.get("lastTopic") : null;
        if (lastTopic && window.toolRegistry) {
            const res = await window.toolRegistry.execute("search_youtube", { query: lastTopic });
            if (res && res.success && res.videoId) {
                await speak(`Playing ${res.title}.`);
                await window.toolRegistry.execute("play_youtube", { videoId: res.videoId, title: res.title });
                return true;
            }
        }

        await speak("I couldn't find a video or course result to play.");
        return true;
    }

    if (intent === "REPEAT") {
        if (V.voice.lastSpokenText && window.speak) {
            await window.speak(V.voice.lastSpokenText);
        }
        return true;
    }

    if (intent === "NEXT_PAGE") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.navigationTools) {
            await window.navigationTools.nextPage();
        }
        return true;
    }

    if (intent === "BACK") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.navigationTools) {
            await window.navigationTools.previousPage();
        } else if (window.goBack) {
            window.goBack();
        }
        return true;
    }

    if (intent === "NAVIGATE_HOME") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.navigationTools) {
            await window.navigationTools.navigate(window.S && window.S.user ? "analyse" : "landing");
        }
        return true;
    }

    if (intent === "NAVIGATE_LOGIN") {
        if (window.navigationTools) {
            await window.navigationTools.navigate("login");
        } else if (window.go) {
            window.go("login");
        }
        return true;
    }

    if (intent === "NAVIGATE_SIGNUP") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.navigationTools) {
            await window.navigationTools.navigate("signup");
        } else if (window.go) {
            window.go("signup");
        }
        return true;
    }

    if (intent === "NAVIGATE_ROADMAP") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.navigationTools) await window.navigationTools.navigate("roadmap");
        return true;
    }

    if (intent === "NAVIGATE_COURSES") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.navigationTools) await window.navigationTools.navigate("courses");
        return true;
    }

    if (intent === "NAVIGATE_PROFILE") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.navigationTools) await window.navigationTools.navigate("profile");
        return true;
    }

    if (intent === "NAVIGATE_PROGRESS") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.navigationTools) await window.navigationTools.navigate("progress");
        return true;
    }

    if (intent === "NAVIGATE_ABOUT") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.go) window.go("about");
        return true;
    }

    if (intent === "LOGOUT") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.authTools) {
            window.authTools.logout();
            await window.speak("You have been logged out.");
        }
        return true;
    }

    if (intent === "READ_PAGE") {
        if (window.pageTools && window.speak) {
            const summary = window.pageTools.getSpokenSummary();
            await window.speak(summary);
        }
        return true;
    }

    if (intent === "HELP") {
        const page = window.pageTools ? window.pageTools.getCurrentPageId() : "landing";
        let helpText = "You can ask me to navigate to analysis, roadmap, or courses. You can also say repeat, go back, read this page, or stop at any time.";
        if (page === 'login') {
            helpText = "Say your email address to log in. You can also say cancel to return home.";
        } else if (page === 'analyse') {
            helpText = "Tell me your dream job, your current skills, and available hours per week. When ready, say submit analysis.";
        }
        if (window.speak) await window.speak(helpText);
        return true;
    }

    if (intent === "START_GUIDED_WORKFLOW") {
        if (window.voiceAssistant) await window.voiceAssistant.cancelCurrentFlow();
        if (window.guidedWorkflow) {
            await window.speak("Starting guided workflow. I will walk you through the complete SkillNexusAI experience.");
            window.guidedWorkflow();
        } else {
            await window.speak("Guided workflow is not available.");
        }
        return true;
    }

    return false; // Not a global command; continue to LLM / conversational flow
}

window.detectIntent = detectIntent;
window.handleGlobalVoiceCommand = handleGlobalVoiceCommand;
