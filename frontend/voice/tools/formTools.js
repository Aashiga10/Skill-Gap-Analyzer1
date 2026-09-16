/**
 * Form Tools Wrapper
 * Safely interacts with DOM form elements without exposing or accepting credentials.
 */
const formTools = {
    /**
     * Set dream job
     */
    setDreamJob(jobTitle) {
        if (!jobTitle) return { success: false, message: "Job title is required." };
        const input = document.getElementById("dream-job");
        if (input) {
            input.value = jobTitle;
            if (window.S) window.S.dreamJob = jobTitle;
            if (window.conversationContext) {
                window.conversationContext.updateData("dreamJob", jobTitle);
            }
            return { success: true, message: `Set dream job to ${jobTitle}.` };
        }
        return { success: false, message: "Dream job field not found on this page." };
    },

    /**
     * Add one or multiple skills
     */
    addSkills(skillsInput) {
        if (!skillsInput) return { success: false, message: "Skills are required." };
        
        let skillsList = [];
        if (Array.isArray(skillsInput)) {
            skillsList = skillsInput;
        } else if (typeof skillsInput === 'string') {
            skillsList = skillsInput.split(/,|and|\+/i).map(s => s.trim()).filter(s => s.length > 0);
        }

        if (skillsList.length === 0) {
            return { success: false, message: "No valid skills parsed." };
        }

        if (window.S) {
            window.S.skills = window.S.skills || [];
            skillsList.forEach(sk => {
                // Prevent duplicate additions
                if (!window.S.skills.some(s => s.toLowerCase() === sk.toLowerCase())) {
                    window.S.skills.push(sk);
                }
            });
            if (window.renderTags) window.renderTags();
            if (window.conversationContext) {
                window.conversationContext.updateData("skills", [...window.S.skills]);
            }
            return { 
                success: true, 
                message: `Added skills: ${skillsList.join(", ")}.`, 
                data: window.S.skills 
            };
        }
        return { success: false, message: "Skills state not initialized." };
    },

    /**
     * Set hours available per week
     */
    setHours(hours) {
        const h = parseInt(hours);
        if (isNaN(h) || h <= 0) {
            return { success: false, message: "Please provide a valid number of hours." };
        }

        const select = document.getElementById("hours-week");
        if (select) {
            // Find closest matching option or select standard
            const validOptions = [5, 10, 20, 40];
            let closest = validOptions.reduce((prev, curr) => Math.abs(curr - h) < Math.abs(prev - h) ? curr : prev);
            select.value = closest.toString();
            if (window.S) window.S.hoursPerWeek = closest;
            if (window.conversationContext) {
                window.conversationContext.updateData("hoursPerWeek", closest);
            }
            return { success: true, message: `Set learning hours to ${closest} hours per week.` };
        }
        return { success: false, message: "Hours selector not found on this page." };
    },

    /**
     * Fill generic field (non-sensitive only)
     */
    fillField(field, value) {
        if (!field) return { success: false, message: "Field name required." };

        const f = field.toLowerCase().trim();
        // Strict guard: reject passwords
        if (/pass/i.test(f)) {
            return { success: false, message: "Passwords cannot be filled via general tool calls." };
        }

        if (f === 'dreamjob' || f === 'job' || f === 'dream-job') {
            return this.setDreamJob(value);
        }
        if (f === 'skills' || f === 'skill') {
            return this.addSkills(value);
        }
        if (f === 'hours' || f === 'time') {
            return this.setHours(value);
        }
        if (f === 'email') {
            const emailInp = document.getElementById("login-email") || document.getElementById("su-email");
            if (emailInp) {
                emailInp.value = value;
                if (window.conversationContext) {
                    window.conversationContext.updateData("email", value);
                }
                return { success: true, message: `Entered email ${value}.` };
            }
        }
        if (f === 'name') {
            const nameInp = document.getElementById("su-name");
            if (nameInp) {
                nameInp.value = value;
                if (window.conversationContext) {
                    window.conversationContext.updateData("name", value);
                }
                return { success: true, message: `Entered name ${value}.` };
            }
        }

        return { success: false, message: `Could not identify field "${field}".` };
    },

    /**
     * Submit a specific form
     */
    submitForm(formName) {
        const form = (formName || '').toLowerCase().trim();

        if (form === 'analyse' || form === 'skills') {
            if (window.analyzeSkills) {
                window.analyzeSkills();
                return { success: true, message: "Skill analysis submitted." };
            }
        }
        if (form === 'login') {
            if (window.authTools) {
                return window.authTools.submitLogin();
            }
        }
        if (form === 'signup') {
            if (window.doLogin) {
                window.doLogin('signup');
                return { success: true, message: "Sign up form submitted." };
            }
        }

        return { success: false, message: `Unknown form: ${formName}.` };
    }
};

window.formTools = formTools;
