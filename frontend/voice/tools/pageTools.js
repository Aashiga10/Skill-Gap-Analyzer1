/**
 * Page Scanner & Semantic Page Tools
 * Extracts structured, non-sensitive page state and generates concise summaries.
 */
const pageTools = {
    /**
     * Get accurate current active page ID
     */
    getCurrentPageId() {
        // First check outer screens: landing, login, signup, about, admin
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
            const screenId = activeScreen.id.replace('screen-', '');
            if (screenId !== 'app') {
                return screenId;
            }
        }
        // If screen-app is active, check active in-app page
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            return activePage.id.replace('page-', '');
        }
        return 'landing';
    },

    /**
     * Scans current visible container for semantic context
     */
    scanPage(targetPageId) {
        const pageId = targetPageId || this.getCurrentPageId();
        let container = document.getElementById('page-' + pageId) || 
                        document.getElementById('screen-' + pageId) || 
                        document.querySelector('.page.active') || 
                        document.querySelector('.screen.active');

        if (!container) {
            return { page: pageId, title: pageId, elements: [], stats: {} };
        }

        // Extract title
        const titleEl = container.querySelector('h1, h2');
        const title = titleEl ? titleEl.innerText.trim().replace(/\s+/g, ' ') : pageId;

        // Extract inputs (NEVER extract value of password inputs!)
        const inputs = [];
        container.querySelectorAll('input, select, textarea').forEach(el => {
            if (el.offsetParent === null || el.getAttribute('aria-hidden') === 'true') return;
            const type = el.type || el.tagName.toLowerCase();
            const id = el.id || el.name || '';
            const placeholder = el.placeholder || '';
            
            // Find associated label
            let label = '';
            if (id) {
                const labelEl = container.querySelector(`label[for="${id}"]`);
                if (labelEl) label = labelEl.innerText.trim();
            }
            if (!label && el.closest('.form-group')) {
                const grpLabel = el.closest('.form-group').querySelector('label');
                if (grpLabel) label = grpLabel.innerText.trim();
            }

            inputs.push({
                type: type === 'password' ? 'password' : type,
                id: id,
                label: label || placeholder || id,
                placeholder: placeholder,
                value: type === 'password' ? '[PROTECTED]' : (el.value || '')
            });
        });

        // Extract primary action buttons
        const actions = [];
        container.querySelectorAll('button, a.btn').forEach(btn => {
            if (btn.offsetParent === null || btn.getAttribute('aria-hidden') === 'true') return;
            const text = btn.innerText.trim().replace(/\s+/g, ' ');
            if (text && text.length < 40) {
                actions.push({ id: btn.id || '', text: text });
            }
        });

        // Extract dashboard stats if on results or profile
        const stats = {};
        if (pageId === 'results') {
            const scoreEl = document.getElementById('score-text');
            if (scoreEl) stats.score = scoreEl.textContent.trim();
            if (window.S) {
                stats.dreamJob = window.S.dreamJob || '';
                stats.skillsHave = window.S.skillsHave || [];
                stats.skillsNeed = window.S.skillsNeed || [];
            }
        } else if (pageId === 'profile' && window.S) {
            stats.user = window.S.user?.name || '';
            stats.dreamJob = window.S.dreamJob || '';
            stats.hours = window.S.hoursPerWeek || '';
        }

        return {
            page: pageId,
            title: title,
            elements: inputs,
            actions: actions.slice(0, 6),
            stats: stats
        };
    },

    /**
     * Generates a concise spoken summary of the page rather than reading everything
     */
    getSpokenSummary(targetPageId) {
        const scan = this.scanPage(targetPageId);
        const page = scan.page;

        if (page === 'landing') {
            return "You are on the SkillNexus AI home page. You can say login, get started, or ask to explore skills.";
        }
        if (page === 'login') {
            return "You are on the Login screen. You can say your email address to sign in.";
        }
        if (page === 'signup') {
            return "You are on the Sign Up screen. You can tell me your name and email to create an account.";
        }
        if (page === 'analyse') {
            const job = document.getElementById('dream-job')?.value || '';
            const jobMsg = job ? `Your current target job is ${job}.` : "You haven't set a dream job yet.";
            return `You are on the Skill Analysis dashboard. ${jobMsg} You can tell me your dream job, your existing skills, or ask me to submit the analysis.`;
        }
        if (page === 'results') {
            const score = scan.stats.score || (window.S ? window.S.matchScore + '%' : '0%');
            const job = scan.stats.dreamJob || (window.S ? window.S.dreamJob : 'your role');
            const haveCount = scan.stats.skillsHave?.length || 0;
            const needCount = scan.stats.skillsNeed?.length || 0;
            return `You are on the Results page for ${job}. Your skill match score is ${score}. You have ${haveCount} matching skills, and ${needCount} skills to learn. You can ask me to view the roadmap or browse courses.`;
        }
        if (page === 'roadmap') {
            return "You are on your personalized Learning Roadmap. It breaks down your weekly study steps.";
        }
        if (page === 'courses') {
            return "You are on the Course Recommendations page. Here you can explore curated courses tailored to your missing skills.";
        }
        if (page === 'progress') {
            return "You are on the Progress tracking page, where you can see your completed courses and skill milestones.";
        }
        if (page === 'profile') {
            const name = scan.stats.user || 'Student';
            return `You are on the Profile page for ${name}. You can review your career goals and account information here.`;
        }

        return `You are on the ${scan.title} page.`;
    }
};

window.pageTools = pageTools;
