/**
 * Navigation Tools Wrapper
 * Safely navigates between application screens and in-app pages.
 */
const navigationTools = {
    ALLOWED_SCREENS: ['landing', 'login', 'signup', 'about', 'admin'],
    ALLOWED_PAGES: ['analyse', 'results', 'roadmap', 'courses', 'progress', 'profile'],
    isNavigating: false,

    getCurrentScreenId() {
        const activeScreen = document.querySelector('.screen.active');
        return activeScreen ? activeScreen.id.replace('screen-', '') : 'landing';
    },

    getCurrentPageId() {
        const activePage = document.querySelector('.page.active');
        return activePage ? activePage.id.replace('page-', '') : 'analyse';
    },

    /**
     * Navigate to a screen or in-app page
     */
    async navigate(pageName, announceSpoken = true) {
        if (!pageName || typeof pageName !== 'string') {
            return { success: false, message: "Invalid page specified." };
        }

        const target = pageName.toLowerCase().trim();

        // Screen mapping
        if (this.ALLOWED_SCREENS.includes(target)) {
            if (window.go) {
                this.isNavigating = true;
                try {
                    window.go(target);
                    if (window.conversationContext) {
                        window.conversationContext.setPage(target);
                    }
                    const msg = target === 'login'
                        ? "Opened login screen. Say: 'Hi, I am' followed by your name to log in with voice, or say 'continue with Google'."
                        : `Navigated to ${target} screen.`;
                    if (announceSpoken && window.speak) {
                        await window.speak(msg);
                    }
                    if (window.startListening) {
                        window.startListening();
                    }
                    return { success: true, message: msg };
                } finally {
                    this.isNavigating = false;
                }
            }
        }

        // In-app page mapping
        if (this.ALLOWED_PAGES.includes(target)) {
            // Check authentication - NEVER auto-navigate to login without explicit user command
            if (!window.S || !window.S.user) {
                const msg = "You need to log in first to access this section. Say 'go to login' when you are ready.";
                if (announceSpoken && window.speak) await window.speak(msg);
                return { 
                    success: false, 
                    message: msg
                };
            }

            // Ensure screen-app is active
            const appScreen = document.getElementById('screen-app');
            if (appScreen && !appScreen.classList.contains('active')) {
                if (window.go) window.go('app');
            }

            if (window.goTo) {
                await window.goTo(target);
                if (window.conversationContext) {
                    window.conversationContext.setPage(target);
                }
                const friendlyName = {
                    analyse: "Skill Analysis dashboard",
                    results: "Analysis Results",
                    roadmap: "Learning Roadmap",
                    courses: "Recommended Courses",
                    progress: "Learning Progress",
                    profile: "User Profile"
                }[target] || `${target} page`;

                const msg = `Opened ${friendlyName}.`;
                if (announceSpoken && window.speak) {
                    await window.speak(msg);
                }
                return { success: true, message: msg };
            }
        }

        // Aliases
        if (target === 'dashboard' || target === 'home') {
            return this.navigate(window.S && window.S.user ? 'analyse' : 'landing', announceSpoken);
        }

        return { 
            success: false, 
            message: `Page "${pageName}" was not found. Valid pages are analysis, results, roadmap, courses, progress, or profile.` 
        };
    },

    /**
     * Switch to the next logical page in sequence upon user command
     */
    async nextPage() {
        const screen = this.getCurrentScreenId();

        if (screen === 'landing') {
            if (window.S && window.S.user) {
                return this.navigate('analyse');
            } else {
                return this.navigate('login');
            }
        }

        if (screen === 'login') {
            if (window.S && window.S.user) {
                return this.navigate('analyse');
            } else {
                return this.navigate('signup');
            }
        }

        if (screen === 'signup') {
            if (window.S && window.S.user) {
                return this.navigate('analyse');
            } else {
                return this.navigate('login');
            }
        }

        if (screen === 'about') {
            return this.navigate(window.S && window.S.user ? 'analyse' : 'landing');
        }

        if (screen === 'app') {
            const curPage = this.getCurrentPageId();
            const pageOrder = ['analyse', 'results', 'roadmap', 'courses', 'progress', 'profile'];
            const idx = pageOrder.indexOf(curPage);

            if (idx >= 0 && idx < pageOrder.length - 1) {
                const nextTarget = pageOrder[idx + 1];
                return this.navigate(nextTarget);
            } else if (idx === pageOrder.length - 1) {
                const msg = "You are on your profile, the final section. Say 'go to analysis' or 'go home' to return.";
                if (window.speak) await window.speak(msg);
                return { success: true, message: msg };
            }
        }

        return this.navigate(window.S && window.S.user ? 'analyse' : 'landing');
    },

    /**
     * Switch to the previous logical page in sequence upon user command
     */
    async previousPage() {
        const screen = this.getCurrentScreenId();

        if (screen === 'landing') {
            const msg = "You are already on the home screen.";
            if (window.speak) await window.speak(msg);
            return { success: true, message: msg };
        }

        if (screen === 'login' || screen === 'signup' || screen === 'about' || screen === 'admin') {
            return this.navigate('landing');
        }

        if (screen === 'app') {
            const curPage = this.getCurrentPageId();
            const pageOrder = ['analyse', 'results', 'roadmap', 'courses', 'progress', 'profile'];
            const idx = pageOrder.indexOf(curPage);

            if (idx > 0) {
                const prevTarget = pageOrder[idx - 1];
                return this.navigate(prevTarget);
            } else if (idx === 0) {
                const msg = "You are on the first section, Skill Analysis.";
                if (window.speak) await window.speak(msg);
                return { success: true, message: msg };
            }
        }

        if (window.goBack) {
            window.goBack();
            return { success: true, message: "Navigated back." };
        }

        return { success: false, message: "Cannot go back." };
    },

    /**
     * Go back to the previous page
     */
    goBack() {
        return this.previousPage();
    }
};

window.navigationTools = navigationTools;
