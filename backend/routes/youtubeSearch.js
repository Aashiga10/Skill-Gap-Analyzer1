import express from "express";

const router = express.Router();

/**
 * YouTube Search Endpoint via SerpApi
 * GET /api/youtube/search?q=<topic>
 * POST /api/youtube/search with JSON { q: "<topic>" }
 */
router.all("/search", async (req, res) => {
  try {
    const query = (req.query.q || req.body?.q || req.query.query || req.body?.query || "").trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query 'q' is required."
      });
    }

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: "SerpApi key is not configured in environment variables."
      });
    }

    const serpApiUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(query)}&api_key=${apiKey}`;

    const response = await fetch(serpApiUrl, {
      method: "GET",
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return res.status(response.status).json({
        success: false,
        message: `SerpApi request failed with status ${response.status}: ${errText}`
      });
    }

    const data = await response.json();

    // SerpApi's youtube engine returns results in video_results
    const videoResults = data.video_results;
    if (!videoResults || !Array.isArray(videoResults) || videoResults.length === 0) {
      return res.json({
        success: false,
        message: `No video results found on YouTube for: "${query}".`
      });
    }

    const firstVideo = videoResults[0];

    // Extract video ID from link or directly from SerpApi properties
    let videoId = firstVideo.video_id || "";
    if (!videoId && firstVideo.link) {
      const match = firstVideo.link.match(/(?:v=|\/embed\/|\/watch\?v=)([a-zA-Z0-9_-]{11})/);
      if (match) {
        videoId = match[1];
      }
    }

    if (!videoId) {
      return res.json({
        success: false,
        message: "Could not extract video ID from search results."
      });
    }

    const title = firstVideo.title || query;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    return res.json({
      success: true,
      videoId,
      title,
      url
    });

  } catch (error) {
    console.error("YouTube search error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal error searching YouTube: " + error.message
    });
  }
});

export default router;
