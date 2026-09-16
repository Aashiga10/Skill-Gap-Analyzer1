/**
 * Jarvis Conversational Login Flow
 * State machine managing conversational authentication.
 * SECURITY: PASSWORDS ARE CAPTURED LOCALLY VIA CLIENT STT AND PLACED
 * DIRECTLY INTO THE DOM INPUT. THEY ARE NEVER SENT TO THE LLM OR CONTEXT MEMORY.
 */
window.voiceFlows = window.voiceFlows || {};

window.voiceFlows.login = async function(prefilledEmail = null) {
    V.voiceSession.flowName = "LOGIN";
    V.voiceSession.active = true;
    V.voiceSession.cancelled = false;

    // Check if user is already logged in
    if (window.S && window.S.user) {
        await speak(`You are already logged in as ${window.S.user.name || 'Student'}. Taking you to your dashboard.`);
        if (window.navigationTools) await window.navigationTools.navigate("analyse");
        return;
    }

    // Ensure we are on the login screen
    if (window.navigationTools) {
        await window.navigationTools.navigate("login");
    }

    let email = prefilledEmail || document.getElementById("login-email")?.value.trim() || "";
    let name = "";

    // 1. Collect Email if not already present
    if (!email) {
        let attempts = 0;
        while (!email && attempts < 3 && !V.voiceSession.cancelled) {
            const promptMsg = attempts === 0 
                ? "Welcome. Please tell me your email address to sign in." 
                : "Please speak your email address clearly.";
            
            const response = await voiceAssistant.askQuestion(promptMsg);
            if (!response || V.voiceSession.cancelled) return;

            const text = response.text;

            if (/google/i.test(text)) {
                await speak("Continuing with Google.");
                const btn = document.getElementById("btn-google-login") || document.querySelector("#screen-login .social-btn");
                if (btn) btn.click();
                else if (window.doLogin) window.doLogin('google');
                return;
            }
            
            // If user also spoke their name: "My name is X and my email is Y"
            const nameMatch = text.match(/(?:my name is|i am|this is)\s+([a-zA-Z\s]+?)(?:\s+and|\s+my email|$)/i);
            if (nameMatch) {
                name = nameMatch[1].trim();
            }

            const parsed = parseSpokenEmail(text);
            if (parsed && parsed.includes("@") && parsed.includes(".")) {
                email = parsed;
                const emailInp = document.getElementById("login-email");
                if (emailInp) emailInp.value = email;
            } else {
                attempts++;
                if (attempts < 3) {
                    await speak("I couldn't detect a valid email. For example, you can say: sanjay at gmail dot com.");
                }
            }
        }
    } else {
        const emailInp = document.getElementById("login-email");
        if (emailInp) emailInp.value = email;
    }

    if (!email || V.voiceSession.cancelled) {
        if (!V.voiceSession.cancelled) {
            await speak("Let's switch to manual typing for the email address.");
        }
        return;
    }

    // 2. Collect Password Locally (Strictly Local Client STT — Never sent to LLM)
    let passwordReceived = false;
    let passAttempts = 0;

    while (!passwordReceived && passAttempts < 3 && !V.voiceSession.cancelled) {
        const passPrompt = passAttempts === 0
            ? "Now please say your password."
            : "Please repeat your password.";

        await speak(passPrompt);
        if (V.voiceSession.cancelled) return;

        // Listen locally
        const passResponse = await listen();
        if (V.voiceSession.cancelled) return;

        if (passResponse && passResponse.text && passResponse.text.trim()) {
            // Local client-side processing: strip spacing from spoken characters
            const rawPassword = passResponse.text.replace(/\s+/g, "");
            const passInp = document.getElementById("login-pass");
            if (passInp) {
                passInp.value = rawPassword;
            }
            passwordReceived = true;
            if (passResponse.audioBlob) {
                window.lastAudioBlob = passResponse.audioBlob;
            }
        } else {
            passAttempts++;
            if (passAttempts < 3) {
                await speak("I didn't hear a password. Please try speaking it once more.");
            }
        }
    }

    if (!passwordReceived || V.voiceSession.cancelled) {
        if (!V.voiceSession.cancelled) {
            await speak("I couldn't capture your password. Please type your password manually.");
            document.getElementById("login-pass")?.focus();
            V.voiceSession.active = false;
        }
        return;
    }

    // 2b. Speaker Verification Check (Restricted to Aashiga and Devipriya)
    let speakerVerified = false;
    const authBlob = window.lastAudioBlob;

    if (authBlob) {
        try {
            const formData = new FormData();
            formData.append("audio", authBlob, "voiceauth.webm");
            if (email) formData.append("email", email);
            if (name) formData.append("claimedName", name);

            const verifyRes = await fetch("/api/voice-auth/verify", {
                method: "POST",
                body: formData
            });

            if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                if (verifyData.match && (verifyData.user === "aashiga" || verifyData.user === "devipriya")) {
                    speakerVerified = true;
                    if (window.V && window.V.logEvent) {
                        window.V.logEvent("VOICE_AUTH_VERIFIED", { user: verifyData.user });
                    }
                }
            }
        } catch (err) {
            console.warn("Speaker verification check error:", err);
        }
    }

    if (!speakerVerified || V.voiceSession.cancelled) {
        if (!V.voiceSession.cancelled) {
            await speak("I couldn't verify your voice. Please log in manually.");
            document.getElementById("login-pass")?.focus();
            V.voiceSession.active = false;
        }
        return;
    }

    // 3. Confirmation step
    const confirmPrompt = `I have your login details for ${email}. Shall I sign you in?`;
    const confirmResponse = await voiceAssistant.askQuestion(confirmPrompt);
    if (!confirmResponse || V.voiceSession.cancelled) return;

    if (confirmResponse.intent === "YES") {
        await speak("Signing you in now.");
        
        if (window.doLogin) {
            window.doLogin('email');
        }

        // 4. Verify login outcome
        let waitAttempts = 0;
        let loginSucceeded = false;
        while (waitAttempts < 10) {
            await new Promise(r => setTimeout(r, 500));
            if (window.S && window.S.user) {
                loginSucceeded = true;
                break;
            }
            waitAttempts++;
        }

        if (loginSucceeded) {
            V.voiceSession.active = false;
            const userName = window.S.user.name || "there";
            await speak(`You're logged in! Welcome back, ${userName}. Say 'next' or 'go to dashboard' when you are ready to proceed.`);
        } else {
            await speak("Login failed. Please check your credentials or try typing your password.");
            V.voiceSession.active = false;
        }
    } else {
        await speak("Login cancelled. You can edit your details or say login to try again.");
        V.voiceSession.active = false;
    }
};

/**
 * Enhanced natural spoken email parser
 * Handles words: at, [at], dot, period, underscore, dash, hyphen, minus
 */
function parseSpokenEmail(text) {
    if (!text) return "";
    let s = text.toLowerCase().trim();

    // 1. Symbols normalization (handle [at], at, [dot], dot, underscores, dashes)
    s = s.replace(/\s*\[\s*at\s*\]\s*/gi, ' @ ');
    s = s.replace(/\s+at\s+/gi, ' @ ');
    s = s.replace(/\s*\[\s*(?:dot|period)\s*\]\s*/gi, ' . ');
    s = s.replace(/\s*(?:dot|period)\s*/gi, ' . ');
    s = s.replace(/\s*(?:underscore|under score)\s*/gi, '_');
    s = s.replace(/\s*(?:hyphen|dash|minus)\s*/gi, '-');

    s = s.replace(/\s*@\s*/g, '@');
    s = s.replace(/\s*\.\s*/g, '.');
    s = s.replace(/\s*_\s*/g, '_');
    s = s.replace(/\s*-\s*/g, '-');

    // 2. If user spoke an email prefix ("my email is ...", "email ..."), isolate that segment
    const emailPrefixMatch = s.match(/(?:email\s+(?:address\s+)?(?:is\s+)?|it(?:'s|\s+is)\s+)(.+)/i);
    const targetPart = emailPrefixMatch ? emailPrefixMatch[1].trim() : s;
    const fullMatch = targetPart.replace(/\s+/g, '').match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (fullMatch) return fullMatch[1];

    // 3. Standalone email in string
    const standalone = s.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
    if (standalone) return standalone[1];

    // 4. Fallback cleanup
    s = s.replace(/^(?:my\s+)?(?:email\s+(?:address\s+)?(?:is\s+)?|it(?:'s|\s+is)\s+)/i, '');
    s = s.replace(/\s+/g, '').replace(/[\[\]]/g, '').replace(/[.,;!?]+$/, '');

    return s;
}

window.parseSpokenEmail = parseSpokenEmail;
