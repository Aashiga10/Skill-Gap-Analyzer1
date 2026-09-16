/**
 * Conversational Skill Gap Analysis Flow
 * Allows natural entity provision, multi-entity sentences, and safe submission.
 */
window.voiceFlows = window.voiceFlows || {};

window.voiceFlows.analyse = async function() {
    V.voiceSession.flowName = "ANALYSE";
    V.voiceSession.active = true;
    V.voiceSession.cancelled = false;

    // Check existing values
    let job = document.getElementById("dream-job")?.value.trim() || "";
    let skills = (window.S && window.S.skills && window.S.skills.length > 0) 
        ? [...window.S.skills] 
        : [];
    let hours = parseInt(document.getElementById("hours-week")?.value || "10");

    await speak("Let's configure your skill gap analysis. You can state your dream job, your current skills, and available hours.");

    // Helper: multi-entity extractor from an utterance
    const extractEntities = (text) => {
        let found = false;
        // 1. Dream Job
        const jm = text.match(/(?:dream job (?:is|as)?|job as|become a|be a|role of)\s+([a-zA-Z\s\/]+?)(?:\s+and|\s+skills|\s+with|\s+hours|$)/i);
        if (jm && jm[1].trim()) {
            job = jm[1].trim();
            if (window.formTools) window.formTools.setDreamJob(job);
            found = true;
        }

        // 2. Skills
        const sm = text.match(/(?:skills (?:are|have|know)?|know|skills of)\s+([a-zA-Z0-9,\s\+]+?)(?:\s+and|\s+hours|\s+time|$)/i);
        if (sm && sm[1].trim()) {
            const extracted = sm[1].split(/,|and/i).map(s => s.trim()).filter(s => s);
            if (extracted.length > 0) {
                if (window.formTools) window.formTools.addSkills(extracted);
                skills = window.S ? window.S.skills : extracted;
                found = true;
            }
        }

        // 3. Hours
        const hm = text.match(/(\d+)\s*(?:hours|hrs)/i);
        if (hm) {
            hours = parseInt(hm[1]);
            if (window.formTools) window.formTools.setHours(hours);
            found = true;
        }

        return found;
    };

    // Step 1: Dream Job (if not set)
    if (!job) {
        let attempts = 0;
        while (!job && attempts < 3 && !V.voiceSession.cancelled) {
            const resp = await voiceAssistant.askQuestion("What is your dream job role?");
            if (!resp || V.voiceSession.cancelled) return;

            extractEntities(resp.text);
            if (!job && resp.text) {
                job = resp.text.replace(/^(my dream job is|i want to be a|i want to be)\s+/i, '').trim();
                if (window.formTools) window.formTools.setDreamJob(job);
            }
            attempts++;
        }
    }

    if (V.voiceSession.cancelled) return;

    // Step 2: Skills (if empty)
    if (skills.length === 0) {
        let attempts = 0;
        while (skills.length === 0 && attempts < 3 && !V.voiceSession.cancelled) {
            const resp = await voiceAssistant.askQuestion("What skills do you currently know? You can list them together, like Python and SQL.");
            if (!resp || V.voiceSession.cancelled) return;

            extractEntities(resp.text);
            if (skills.length === 0 && resp.text) {
                const spl = resp.text.replace(/^(i know|my skills are)\s+/i, '').split(/,|and/i).map(s => s.trim()).filter(s => s);
                if (spl.length > 0) {
                    if (window.formTools) window.formTools.addSkills(spl);
                    skills = window.S ? window.S.skills : spl;
                }
            }
            attempts++;
        }
    }

    if (V.voiceSession.cancelled) return;

    // Step 3: Hours (if not set explicitly)
    if (!hours || isNaN(hours)) {
        const resp = await voiceAssistant.askQuestion("How many hours per week can you study?");
        if (resp && resp.text) {
            const parsed = parseInt(resp.text.replace(/[^\d]/g, '')) || 10;
            hours = parsed;
            if (window.formTools) window.formTools.setHours(hours);
        }
    }

    if (V.voiceSession.cancelled) return;

    // Step 4: Summary & Confirmation
    const skillsListStr = skills.slice(0, 4).join(", ");
    const summary = `I have your target job as ${job || 'Web Developer'}, your skills as ${skillsListStr || 'none listed'}, and study time at ${hours} hours per week. Shall I run the analysis?`;

    const confirmResp = await voiceAssistant.askQuestion(summary);
    if (!confirmResp || V.voiceSession.cancelled) return;

    if (confirmResp.intent === "YES") {
        await speak("Analyzing your skills with AI now. Please wait.");
        V.voiceSession.active = false;
        if (window.analyzeSkills) {
            window.analyzeSkills();
        }
    } else {
        await speak("Analysis paused. You can adjust your fields or say submit anytime.");
        V.voiceSession.active = false;
    }
};
