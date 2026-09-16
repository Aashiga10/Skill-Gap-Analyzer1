/**
 * Authentication Tools Wrapper
 * Safely triggers client-side login/logout and inspects authentication status.
 * NEVER ACCESSES OR EXPOSES PASSWORDS TO THE LOGS OR OUTSIDE CONTEXTS.
 */
const authTools = {
    /**
     * Triggers login submission
     */
    submitLogin() {
        const emailInp = document.getElementById("login-email");
        const passInp = document.getElementById("login-pass");

        if (!emailInp || !emailInp.value.trim()) {
            return { success: false, message: "Email is missing. Please provide your email address." };
        }
        if (!passInp || !passInp.value.trim()) {
            return { success: false, message: "Password is missing. Please provide your password." };
        }

        if (window.doLogin) {
            window.doLogin('email');
            return { success: true, message: "Signing you in..." };
        }

        return { success: false, message: "Login function not available." };
    },

    /**
     * Triggers Google login button click
     */
    loginWithGoogle() {
        if (window.go) {
            window.go('login');
        }
        const btn = document.getElementById("btn-google-login") || document.querySelector("#screen-login .social-btn");
        if (btn) {
            btn.click();
            return { success: true, message: "Continuing with Google." };
        } else if (window.doLogin) {
            window.doLogin('google');
            return { success: true, message: "Continuing with Google." };
        }
        return { success: false, message: "Google login button not found." };
    },

    /**
     * Triggers user logout
     */
    logout() {
        if (window.logout) {
            window.logout();
        }
        if (window.conversationContext) {
            window.conversationContext.reset();
        }
        return { success: true, message: "Logged out successfully." };
    },

    /**
     * Checks current login status
     */
    checkAuth() {
        const isAuth = !!(window.S && window.S.user);
        return {
            isAuthenticated: isAuth,
            userName: isAuth ? (window.S.user.name || "Student") : null
        };
    }
};

window.authTools = authTools;
