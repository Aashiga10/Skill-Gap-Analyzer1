/**
 * Conversational Results Readout Flow
 * Scans analysis results, delivers concise spoken summary, and offers next steps.
 */
window.voiceFlows = window.voiceFlows || {};

window.voiceFlows.results = async function() {
    V.voiceSession.flowName = "RESULTS";
    V.voiceSession.active = true;
    V.voiceSession.cancelled = false;

    // Wait until S.resultsReady is true
    let attempts = 0;
    while (!window.S?.resultsReady && attempts < 25) {
        await new Promise(r => setTimeout(r, 400));
        attempts++;
        if (V.voiceSession.cancelled) return;
    }

    if (!window.S?.resultsReady) {
        await speak("The analysis is still taking a moment. Please check your screen.");
        V.voiceSession.active = false;
        return;
    }

    const score = window.S.matchScore || 0;
    const job = window.S.dreamJob || "your selected role";
    const have = window.S.skillsHave || [];
    const need = window.S.skillsNeed || [];

    await speak(`Your skill gap analysis for ${job} is complete!`);
    await speak(`Your overall match score is ${score} percent.`);

    if (have.length > 0) {
        const topHave = have.slice(0, 3).join(", ");
        await speak(`You already possess key skills including: ${topHave}.`);
    }

    if (need.length > 0) {
        const topNeed = need.slice(0, 3).join(", ");
        await speak(`To reach your goal, your top priority skills to learn are: ${topNeed}.`);
    }

    const nextAction = await voiceAssistant.askQuestion(
        "Say 'next' or 'roadmap' to view your learning roadmap, or say 'courses' for recommendations."
    );
    if (!nextAction || V.voiceSession.cancelled) return;

    const t = nextAction.text.toLowerCase();

    if (t.includes("roadmap") || t.includes("plan") || t.includes("schedule") || t.includes("next")) {
        if (window.navigationTools) {
            await window.navigationTools.navigate("roadmap");
        }
    } else if (t.includes("course") || t.includes("learn") || t.includes("study")) {
        if (window.navigationTools) {
            await window.navigationTools.navigate("courses");
        }
    } else if (t.includes("full") || t.includes("breakdown") || t.includes("read") || t.includes("all")) {
        const haveText = have.length > 0 ? have.join(", ") : "none";
        const needText = need.length > 0 ? need.join(", ") : "none";
        await speak(`Complete skill list: Skills you have: ${haveText}. Skills to learn: ${needText}.`);
    } else {
        await speak("You're all set. Say help anytime for available voice commands.");
    }

    V.voiceSession.active = false;
};
