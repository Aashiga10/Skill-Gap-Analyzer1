/**
 * YouTube Player and Search Tools Wrapper
 * Safely handles YouTube search and playback via YouTube IFrame API.
 */
const youtubeTools = {
    player: null,
    isPlayingVideo: false,
    currentVideoId: null,
    apiReadyPromise: null,

    /**
     * Search YouTube via SerpApi backend proxy
     */
    async search(topic) {
        if (!topic || typeof topic !== "string" || !topic.trim()) {
            return { success: false, message: "A search topic is required." };
        }

        const query = topic.trim();
        try {
            if (window.V && window.V.logEvent) {
                window.V.logEvent("YOUTUBE_SEARCH_STARTED", { query });
            }

            const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (window.V && window.V.logEvent) {
                window.V.logEvent("YOUTUBE_SEARCH_COMPLETED", data);
            }

            return data;
        } catch (err) {
            console.error("YouTube search error:", err);
            if (window.V && window.V.logEvent) {
                window.V.logEvent("ERROR", { context: "YouTubeSearch", error: err.message });
            }
            return { success: false, message: `Could not reach YouTube search service: ${err.message}` };
        }
    },

    /**
     * Play video by ID using YouTube IFrame Player API
     */
    async playVideoId(videoId, title = "") {
        if (!videoId || typeof videoId !== "string") {
            return { success: false, message: "Valid YouTube video ID required." };
        }

        const cleanId = videoId.trim();
        this.currentVideoId = cleanId;

        // Bridge directly to In-Website YouTube Clone Player if available
        if (typeof window.playEmbeddedCourse === "function") {
            const courseTitle = title || "YouTube Tutorial";
            window.playEmbeddedCourse(courseTitle, `https://www.youtube.com/watch?v=${cleanId}`, "Career Skill", "Video");
            this.isPlayingVideo = true;
            if (window.V && window.V.logEvent) {
                window.V.logEvent("YOUTUBE_PLAY_STARTED", { videoId: cleanId, title: courseTitle });
            }
            return { success: true, message: `Playing video: ${courseTitle}` };
        }

        // Ensure user is on courses or results page to view video
        if (window.navigationTools) {
            const cur = window.pageTools ? window.pageTools.getCurrentPageId() : "";
            if (cur !== "courses" && cur !== "results") {
                await window.navigationTools.navigate("courses");
            }
        }

        // 1. Ensure Player Container and DOM elements exist
        const playerDiv = this._ensurePlayerDom(title);

        // 2. Load YouTube IFrame API
        await this._loadIframeApi();

        if (window.V && window.V.logEvent) {
            window.V.logEvent("YOUTUBE_PLAY_STARTED", { videoId: cleanId, title });
        }

        return new Promise((resolve) => {
            if (this.player && typeof this.player.loadVideoById === "function") {
                try {
                    this.player.loadVideoById(cleanId);
                    this.player.playVideo();
                    this.isPlayingVideo = true;
                    this._showContainer(title);
                    resolve({ success: true, message: `Playing video: ${title || cleanId}` });
                    return;
                } catch (e) {
                    console.warn("Error re-using existing player, recreating:", e);
                }
            }

            // Create new YT.Player instance
            this.player = new window.YT.Player("yt-player", {
                height: "380",
                width: "100%",
                videoId: cleanId,
                playerVars: {
                    autoplay: 1,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1
                },
                events: {
                    onReady: (event) => {
                        event.target.playVideo();
                        this.isPlayingVideo = true;
                        this._showContainer(title);
                        resolve({ success: true, message: `Playing video: ${title || cleanId}` });
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.PLAYING) {
                            this.isPlayingVideo = true;
                        } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
                            this.isPlayingVideo = false;
                        }
                    },
                    onError: (err) => {
                        console.error("YouTube Player Error:", err);
                        this.isPlayingVideo = false;
                        resolve({ success: false, error: "Failed to play YouTube video." });
                    }
                }
            });
        });
    },

    /**
     * Pause active video
     */
    pause() {
        const iframe = document.getElementById("yt-embedded-iframe");
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } catch(e) {}
        }
        if (this.player && typeof this.player.pauseVideo === "function") {
            try { this.player.pauseVideo(); } catch (e) {}
        }
        this.isPlayingVideo = false;
        if (window.V && window.V.logEvent) {
            window.V.logEvent("YOUTUBE_PAUSED");
        }
    },

    /**
     * Stop video and hide player container
     */
    stop() {
        if (typeof window.closeEmbeddedCourse === "function") {
            window.closeEmbeddedCourse();
        }
        const iframe = document.getElementById("yt-embedded-iframe");
        if (iframe) {
            iframe.src = "";
        }
        if (this.player) {
            try {
                if (typeof this.player.stopVideo === "function") {
                    this.player.stopVideo();
                }
            } catch (e) {}
        }
        this.isPlayingVideo = false;
        const container = document.getElementById("yt-player-container");
        if (container) {
            container.style.display = "none";
        }
        if (window.V && window.V.logEvent) {
            window.V.logEvent("YOUTUBE_STOPPED");
        }
    },

    /**
     * Status check
     */
    isPlaying() {
        return this.isPlayingVideo;
    },

    /**
     * Helper: ensure container and #yt-player exist in DOM
     */
    _ensurePlayerDom(title = "") {
        let container = document.getElementById("yt-player-container");
        let playerEl = document.getElementById("yt-player");

        if (!container) {
            container = document.createElement("div");
            container.id = "yt-player-container";
            container.style.cssText = "display:none;margin:16px auto;max-width:720px;border-radius:16px;overflow:hidden;background:#0f172a;box-shadow:0 12px 36px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);z-index:40;position:relative;";

            const header = document.createElement("div");
            header.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:rgba(15,23,42,0.95);color:#fff;border-bottom:1px solid rgba(255,255,255,0.08);";
            header.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;overflow:hidden;">
                    <span style="color:#ef4444;font-size:1.1rem;">▶️</span>
                    <span id="yt-player-title" style="font-weight:600;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:540px;">${title || "YouTube Video"}</span>
                </div>
                <button type="button" id="yt-player-close-btn" style="background:rgba(255,255,255,0.1);border:none;color:#fff;font-size:1.1rem;cursor:pointer;border-radius:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;" title="Close Player">✕</button>
            `;
            container.appendChild(header);

            playerEl = document.createElement("div");
            playerEl.id = "yt-player";
            container.appendChild(playerEl);

            // Locate insertion target: top of #c-content or #c-list or #page-courses or #page-results
            const insertTarget = document.getElementById("c-list") ||
                                 document.getElementById("c-content") ||
                                 document.getElementById("page-courses") ||
                                 document.getElementById("page-results") ||
                                 document.body;

            if (insertTarget === document.getElementById("c-list") && insertTarget.parentNode) {
                insertTarget.parentNode.insertBefore(container, insertTarget);
            } else {
                insertTarget.prepend(container);
            }

            container.querySelector("#yt-player-close-btn").addEventListener("click", () => {
                this.stop();
            });
        }

        return playerEl;
    },

    _showContainer(title = "") {
        const container = document.getElementById("yt-player-container");
        if (container) {
            container.style.display = "block";
            const titleEl = document.getElementById("yt-player-title");
            if (titleEl && title) {
                titleEl.textContent = title;
            }
        }
    },

    /**
     * Helper: load YouTube IFrame API script tag once
     */
    _loadIframeApi() {
        if (window.YT && window.YT.Player) {
            return Promise.resolve();
        }

        if (this.apiReadyPromise) {
            return this.apiReadyPromise;
        }

        this.apiReadyPromise = new Promise((resolve) => {
            const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
            if (!existingScript) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScript = document.getElementsByTagName("script")[0];
                if (firstScript && firstScript.parentNode) {
                    firstScript.parentNode.insertBefore(tag, firstScript);
                } else {
                    document.head.appendChild(tag);
                }
            }

            const prevCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (typeof prevCallback === "function") prevCallback();
                resolve();
            };

            // Polling safeguard in case ready event fired prior to listener assignment
            const checkInterval = setInterval(() => {
                if (window.YT && window.YT.Player) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });

        return this.apiReadyPromise;
    }
};

window.youtubeTools = youtubeTools;
