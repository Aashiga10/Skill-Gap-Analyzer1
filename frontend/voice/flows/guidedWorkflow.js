/**
 * Guided Workflow Flow
 * Complete voice-guided user journey from landing to profile
 * Handles: Landing -> Voice Biometric Login -> Analyse -> Results -> Roadmap -> Courses -> Progress -> Profile
 */
window.voiceFlows = window.voiceFlows || {};

window.voiceFlows.guidedWorkflow = async function() {
    V.voiceSession.flowName = "GUIDED_WORKFLOW";
    V.voiceSession.active = true;
    V.voiceSession.cancelled = false;
    V.voiceSession.step = "landing";

    const speakQueued = async (text) => {
        if (V.voiceSession.cancelled) return;
        await speak(text, true);
    };

    // Helper to wait for user confirmation
    const askForProceed = async (prompt) => {
        if (V.voiceSession.cancelled) return false;
        const response = await voiceAssistant.askQuestion(prompt);
        if (!response || V.voiceSession.cancelled) return false;
        return response.intent === "YES";
    };

    // Helper to navigate and announce
    const navigateAndAnnounce = async (target, announcement) => {
        if (V.voiceSession.cancelled) return false;
        if (window.navigationTools) {
            await window.navigationTools.navigate(target, false);
        }
        if (announcement) {
            await speakQueued(announcement);
        }
        return true;
    };

    try {
        // ============================================================
        // STEP 1: LANDING PAGE - Welcome and direct to voice login
        // ============================================================
        V.voiceSession.step = "landing";
        await speakQueued("Welcome to SkillNexusAI. Kindly tell go to login page by voice biometric.");

        // Wait for user to say "go to login" or similar
        let loginTriggered = false;
        let attempts = 0;
        while (!loginTriggered && attempts < 5 && !V.voiceSession.cancelled) {
            const response = await voiceAssistant.askQuestion("Say 'go to login' or 'voice login' to proceed with voice biometric authentication.");
            if (!response || V.voiceSession.cancelled) return;
            
            const text = response.text.toLowerCase();
            if (text.includes("login") || text.includes("voice") || text.includes("biometric") || text.includes("sign in")) {
                loginTriggered = true;
            } else {
                attempts++;
                if (attempts < 5) {
                    await speakQueued("I didn't catch that. Please say 'go to login' or 'voice login' to continue.");
                }
            }
        }

        if (!loginTriggered || V.voiceSession.cancelled) {
            await speakQueued("Let's try again later. You can say 'voice login' anytime to start.");
            V.voiceSession.active = false;
            return;
        }

        // ============================================================
        // STEP 2: VOICE BIOMETRIC LOGIN
        // ============================================================
        V.voiceSession.step = "voice_login";
        await speakQueued("Opening voice biometric login. Please say your name to begin.");

        if (window.voiceFlows && window.voiceFlows.login) {
            await window.voiceFlows.login();
        }

        // Wait for login to complete
        let loginComplete = false;
        let loginWaitAttempts = 0;
        while (!loginComplete && loginWaitAttempts < 30 && !V.voiceSession.cancelled) {
            await new Promise(r => setTimeout(r, 1000));
            if (window.S && window.S.user) {
                loginComplete = true;
            }
            loginWaitAttempts++;
        }

        if (!loginComplete || V.voiceSession.cancelled) {
            await speakQueued("Voice login was not completed. You can try again by saying 'voice login'.");
            V.voiceSession.active = false;
            return;
        }

        await speakQueued(`Welcome back, ${window.S.user.name || "Student"}! Voice biometric verification successful.`);

        // ============================================================
        // STEP 3: ANALYSE PAGE - Dream job, skills, hours
        // ============================================================
        V.voiceSession.step = "analyse";
        await navigateAndAnnounce("analyse", "You are in the analyze page. Kindly enter your dream job, like web developer, data scientist, etc.");

        if (window.voiceFlows && window.voiceFlows.analyse) {
            await window.voiceFlows.analyse();
        }

        // Wait for analysis to complete
        let analysisComplete = false;
        let analysisWaitAttempts = 0;
        while (!analysisComplete && analysisWaitAttempts < 60 && !V.voiceSession.cancelled) {
            await new Promise(r => setTimeout(r, 1000));
            if (window.S && window.S.resultsReady) {
                analysisComplete = true;
            }
            analysisWaitAttempts++;
        }

        if (!analysisComplete || V.voiceSession.cancelled) {
            await speakQueued("Analysis is taking longer than expected. Please check your screen.");
            V.voiceSession.active = false;
            return;
        }

        // ============================================================
        // STEP 4: RESULTS PAGE - Skills known and unknown
        // ============================================================
        V.voiceSession.step = "results";
        await navigateAndAnnounce("results", "Here are your analysis results.");

        if (window.voiceFlows && window.voiceFlows.results) {
            await window.voiceFlows.results();
        }

        // Wait for user to proceed
        const proceedToRoadmap = await askForProceed("Say 'proceed' or 'yes' to view your learning roadmap, or say 'courses' to browse courses directly.");
        if (V.voiceSession.cancelled) return;

        // ============================================================
        // STEP 5: ROADMAP PAGE - Step by step with proceed confirmation
        // ============================================================
        if (proceedToRoadmap || (window.S && window.S.dreamJob)) {
            V.voiceSession.step = "roadmap";
            await navigateAndAnnounce("roadmap", "This is your learning roadmap. I will guide you through each week step by step.");

            if (window.S && window.S.roadmap && window.S.roadmap.length > 0) {
                for (let weekIndex = 0; weekIndex < window.S.roadmap.length; weekIndex++) {
                    if (V.voiceSession.cancelled) return;

                    const week = window.S.roadmap[weekIndex];
                    await speakQueued(`Week ${week.week}: ${week.title}. This week has ${week.steps?.length || 5} steps.`);

                    if (week.steps && week.steps.length > 0) {
                        for (let stepIndex = 0; stepIndex < week.steps.length; stepIndex++) {
                            if (V.voiceSession.cancelled) return;

                            const step = week.steps[stepIndex];
                            await speakQueued(`Step ${stepIndex + 1}: ${step}`);

                            // Ask user to proceed to next step
                            const shouldProceed = await askForProceed("Say 'proceed' or 'yes' to continue to the next step, or say 'stop' to pause.");
                            if (!shouldProceed || V.voiceSession.cancelled) {
                                await speakQueued("Roadmap paused. Say 'continue roadmap' when you are ready to resume.");
                                // Wait for continue command
                                let resumed = false;
                                while (!resumed && !V.voiceSession.cancelled) {
                                    const resumeResp = await voiceAssistant.askQuestion("Say 'continue' or 'proceed' to resume the roadmap.");
                                    if (!resumeResp || V.voiceSession.cancelled) return;
                                    if (resumeResp.intent === "YES" || resumeResp.text.toLowerCase().includes("continue") || resumeResp.text.toLowerCase().includes("proceed")) {
                                        resumed = true;
                                    }
                                }
                            }
                        }
                    }

                    // Ask to proceed to next week
                    if (weekIndex < window.S.roadmap.length - 1) {
                        const proceedWeek = await askForProceed(`Week ${week.week} complete. Say 'proceed' or 'yes' to continue to week ${weekIndex + 2}.`);
                        if (!proceedWeek || V.voiceSession.cancelled) {
                            await speakQueued("Roadmap paused. Say 'continue roadmap' to resume.");
                            let resumed = false;
                            while (!resumed && !V.voiceSession.cancelled) {
                                const resumeResp = await voiceAssistant.askQuestion("Say 'continue' or 'proceed' to resume.");
                                if (!resumeResp || V.voiceSession.cancelled) return;
                                if (resumeResp.intent === "YES" || resumeResp.text.toLowerCase().includes("continue") || resumeResp.text.toLowerCase().includes("proceed")) {
                                    resumed = true;
                                }
                            }
                        }
                    }
                }
                await speakQueued("Congratulations! You have completed all weeks in your learning roadmap.");
            } else {
                await speakQueued("No roadmap available. Please complete the analysis first.");
            }
        }

        // ============================================================
        // STEP 6: COURSES PAGE - Video playback with voice control
        // ============================================================
        V.voiceSession.step = "courses";
        await navigateAndAnnounce("courses", "Here are your recommended courses. I will help you watch them.");

        // Wait for courses to load
        await new Promise(r => setTimeout(r, 1000));

        if (window.S && window.S.dreamJob) {
            const jobKey = Object.keys(window.COURSE_DB || {}).find(j => j.toLowerCase() === window.S.dreamJob.toLowerCase());
            const courses = jobKey && window.COURSE_DB[jobKey] ? window.COURSE_DB[jobKey] : [];

            if (courses.length > 0) {
                await speakQueued(`You have ${courses.length} recommended courses for ${window.S.dreamJob}.`);

                for (let i = 0; i < courses.length; i++) {
                    if (V.voiceSession.cancelled) return;

                    const course = courses[i];
                    await speakQueued(`Course ${i + 1}: ${course.name} for ${course.skill}. Duration: ${course.duration}.`);

                    const playCourse = await askForProceed(`Say 'play' or 'yes' to watch "${course.name}", or 'skip' to go to the next course.`);
                    if (V.voiceSession.cancelled) return;

                    if (playCourse) {
                        // Play the course
                        if (window.playEmbeddedCourse) {
                            window.playEmbeddedCourse(course.name, course.url, course.skill, course.duration);
                        }

                        await speakQueued(`Now playing ${course.name}. Say 'close' or 'stop' to close the video, or 'mark completed' when you finish watching.`);

                        // Wait for video control commands
                        let videoControlled = false;
                        while (!videoControlled && !V.voiceSession.cancelled) {
                            const videoResp = await voiceAssistant.askQuestion("Say 'close' to close the video, or 'mark completed' when finished.");
                            if (!videoResp || V.voiceSession.cancelled) return;

                            const videoText = videoResp.text.toLowerCase();
                            if (videoText.includes("close") || videoText.includes("stop") || videoText.includes("exit")) {
                                if (window.closeEmbeddedCourse) {
                                    window.closeEmbeddedCourse();
                                }
                                await speakQueued("Video closed.");
                                videoControlled = true;
                            } else if (videoText.includes("mark completed") || videoText.includes("completed") || videoText.includes("done")) {
                                if (window.toggleCurrentCourseDone) {
                                    window.toggleCurrentCourseDone();
                                }
                                if (window.closeEmbeddedCourse) {
                                    window.closeEmbeddedCourse();
                                }
                                await speakQueued("Course marked as completed. Well done!");
                                videoControlled = true;
                            } else {
                                await speakQueued("I didn't understand. Say 'close' to close the video, or 'mark completed' when finished.");
                            }
                        }
                    } else {
                        await speakQueued("Skipping to next course.");
                    }
                }
                await speakQueued("All recommended courses have been presented.");
            } else {
                await speakQueued("No courses available for your selected dream job.");
            }
        }

        // ============================================================
        // STEP 7: PROGRESS PAGE
        // ============================================================
        V.voiceSession.step = "progress";
        const proceedToProgress = await askForProceed("Say 'proceed' or 'yes' to view your learning progress.");
        if (V.voiceSession.cancelled) return;

        if (proceedToProgress) {
            await navigateAndAnnounce("progress", "This is your progress page. You can track your overall progress, skills progress, and completed courses.");

            // Read progress summary
            if (window.pageTools) {
                const summary = window.pageTools.getSpokenSummary();
                if (summary) {
                    await speakQueued(summary);
                }
            }
        }

        // ============================================================
        // STEP 8: PROFILE PAGE
        // ============================================================
        V.voiceSession.step = "profile";
        const proceedToProfile = await askForProceed("Say 'proceed' or 'yes' to view your profile.");
        if (V.voiceSession.cancelled) return;

        if (proceedToProfile) {
            await navigateAndAnnounce("profile", "This is your profile page. You can view your name, email, dream job, study hours, skills learned, and learning goals.");

            if (window.pageTools) {
                const summary = window.pageTools.getSpokenSummary();
                if (summary) {
                    await speakQueued(summary);
                }
            }
        }

        // ============================================================
        // WORKFLOW COMPLETE
        // ============================================================
        await speakQueued("Congratulations! You have completed the full guided workflow. You can now explore any section by saying its name, like 'go to roadmap', 'go to courses', or 'go to profile'. Thank you for using SkillNexusAI!");

    } catch (error) {
        console.error("Error in guided workflow:", error);
        if (!V.voiceSession.cancelled) {
            await speakQueued("An error occurred in the guided workflow. Please try again or navigate manually.");
        }
    } finally {
        V.voiceSession.active = false;
        V.voiceSession.flowName = null;
        V.voiceSession.step = null;
    }
};

// Helper function to start the guided workflow from anywhere
window.startGuidedWorkflow = async function() {
    if (V.voiceSession && V.voiceSession.active) {
        await speak("A workflow is already in progress. Say 'stop' to cancel it first.");
        return;
    }
    if (window.voiceFlows && window.voiceFlows.guidedWorkflow) {
        await window.voiceFlows.guidedWorkflow();
    }
};

// Export for global access
window.guidedWorkflow = window.voiceFlows.guidedWorkflow;