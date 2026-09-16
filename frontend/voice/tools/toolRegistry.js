/**
 * Controlled Website Tool Registry
 * Validates and executes safe website actions determined by the LLM reasoning layer.
 */
class ToolRegistry {
    constructor() {
        this.tools = new Map();
        this.registerDefaultTools();
    }

    registerTool(name, handler, validator = null) {
        this.tools.set(name, { handler, validator });
    }

    async execute(toolName, args = {}) {
        V.logEvent("TOOL_SELECTED", { tool: toolName, arguments: args });

        const tool = this.tools.get(toolName);
        if (!tool) {
            V.logEvent("ERROR", { message: `Tool "${toolName}" is not registered.` });
            return { success: false, error: `Tool "${toolName}" is not recognized.` };
        }

        // Validate arguments
        if (tool.validator) {
            const validationError = tool.validator(args);
            if (validationError) {
                V.logEvent("ERROR", { message: validationError, tool: toolName });
                return { success: false, error: validationError };
            }
        }

        try {
            const result = await tool.handler(args);
            V.logEvent("TOOL_EXECUTED", { tool: toolName, result });
            return result;
        } catch (err) {
            console.error(`Error executing tool ${toolName}:`, err);
            V.logEvent("ERROR", { tool: toolName, error: err.message });
            return { success: false, error: err.message };
        }
    }

    registerDefaultTools() {
        // 1. get_current_page
        this.registerTool("get_current_page", async () => {
            const page = window.pageTools ? window.pageTools.getCurrentPageId() : "landing";
            return { success: true, page };
        });

        // 2. read_page
        this.registerTool("read_page", async () => {
            if (window.pageTools) {
                const summary = window.pageTools.getSpokenSummary();
                if (window.speak) await window.speak(summary);
                return { success: true, summary };
            }
            return { success: false, error: "Page scanner not available." };
        });

        // 3. navigate
        this.registerTool("navigate", async (args) => {
            if (window.navigationTools) {
                return await window.navigationTools.navigate(args.page);
            }
            return { success: false, error: "Navigation tools not available." };
        }, (args) => {
            if (!args || !args.page) return "Page argument is required.";
            return null;
        });

        // 3b. next_page
        this.registerTool("next_page", async () => {
            if (window.navigationTools) {
                return await window.navigationTools.nextPage();
            }
            return { success: false, error: "Navigation tools not available." };
        });

        // 3c. previous_page
        this.registerTool("previous_page", async () => {
            if (window.navigationTools) {
                return await window.navigationTools.previousPage();
            }
            return { success: false, error: "Navigation tools not available." };
        });

        // 4. fill_field
        this.registerTool("fill_field", async (args) => {
            if (window.formTools) {
                return window.formTools.fillField(args.field, args.value);
            }
            return { success: false, error: "Form tools not available." };
        }, (args) => {
            if (!args || !args.field) return "Field name is required.";
            if (args.value === undefined) return "Field value is required.";
            return null;
        });

        // 5. add_skill
        this.registerTool("add_skill", async (args) => {
            if (window.formTools) {
                return window.formTools.addSkills(args.skill || args.skills);
            }
            return { success: false, error: "Form tools not available." };
        });

        // 6. set_hours
        this.registerTool("set_hours", async (args) => {
            if (window.formTools) {
                return window.formTools.setHours(args.hours);
            }
            return { success: false, error: "Form tools not available." };
        });

        // 7. submit_form
        this.registerTool("submit_form", async (args) => {
            if (window.formTools) {
                return window.formTools.submitForm(args.form);
            }
            return { success: false, error: "Form tools not available." };
        });

        // 8. login
        this.registerTool("login", async (args) => {
            if (window.navigationTools) {
                await window.navigationTools.navigate("login");
            }
            if (args && args.email && window.voiceFlows && window.voiceFlows.login) {
                setTimeout(() => window.voiceFlows.login(args.email), 300);
            }
            return { success: true, message: "Opened login screen." };
        });

        // 8b. google_login
        this.registerTool("google_login", async () => {
            if (window.authTools && window.authTools.loginWithGoogle) {
                return window.authTools.loginWithGoogle();
            }
            const btn = document.getElementById("btn-google-login") || document.querySelector("#screen-login .social-btn");
            if (btn) {
                btn.click();
                return { success: true, message: "Continuing with Google." };
            }
            return { success: false, error: "Google login button not found." };
        });

        // 9. logout
        this.registerTool("logout", async () => {
            if (window.authTools) {
                const res = window.authTools.logout();
                if (window.navigationTools) window.navigationTools.navigate("landing");
                return res;
            }
            return { success: false, error: "Auth tools not available." };
        });

        // 10. get_dashboard_data
        this.registerTool("get_dashboard_data", async () => {
            if (window.pageTools) {
                const scan = window.pageTools.scanPage("results");
                return { success: true, stats: scan.stats };
            }
            return { success: false, error: "Page tools not available." };
        });

        // 11. repeat_last_response
        this.registerTool("repeat_last_response", async () => {
            if (V.voice.lastSpokenText && window.speak) {
                await window.speak(V.voice.lastSpokenText);
                return { success: true };
            }
            return { success: false, message: "Nothing to repeat." };
        });

        // 12. cancel_current_flow
        this.registerTool("cancel_current_flow", async () => {
            if (window.voiceAssistant) {
                await window.voiceAssistant.cancelCurrentFlow();
            }
            return { success: true, message: "Flow cancelled." };
        });

        // 13. click (safe element clicker)
        this.registerTool("click", async (args) => {
            if (!args || !args.selector) return { success: false, error: "Selector required." };
            const el = document.querySelector(args.selector);
            if (!el) return { success: false, error: `Element ${args.selector} not found.` };
            el.click();
            return { success: true, message: `Clicked ${args.selector}.` };
        });

        // 14. none
        this.registerTool("none", async () => {
            return { success: true };
        });

        // 15. search_youtube
        this.registerTool("search_youtube", async (args) => {
            if (window.youtubeTools) {
                const topic = args.query || args.topic || args.q;
                return await window.youtubeTools.search(topic);
            }
            return { success: false, error: "YouTube tools not available." };
        }, (args) => {
            if (!args || (!args.query && !args.topic && !args.q)) {
                return "A search topic or query is required.";
            }
            return null;
        });

        // 16. play_youtube
        this.registerTool("play_youtube", async (args) => {
            if (window.youtubeTools) {
                return await window.youtubeTools.playVideoId(args.videoId, args.title || "");
            }
            return { success: false, error: "YouTube tools not available." };
        }, (args) => {
            if (!args || !args.videoId) {
                return "Video ID is required.";
            }
            return null;
        });
    }
}

window.toolRegistry = new ToolRegistry();
