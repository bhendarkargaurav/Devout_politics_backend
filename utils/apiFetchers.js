import axios from "axios";
import { ApifyClient } from "apify-client";

// API Keys
const apifyToken = 'apify_api_BP7teKSkBtXCfV8oqmZWvbwiVwhbac2CGQTv';
const youtubeApiKey = 'AIzaSyASyv089yEe9a5CXGB2OHYbGVD0oCLC0vA';

// Initialize Apify client
const apifyClient = new ApifyClient({ token: apifyToken });

/**
 * 📺 Get YouTube Views
 */
export const getYoutubeViews = async (youtubeUrl) => {
  try {
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) return 0;

    const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "statistics",
        id: videoId,
        key: youtubeApiKey
      }
    });

    const views = response.data?.items?.[0]?.statistics?.viewCount || 0;
    return parseInt(views);
  } catch (error) {
    console.error("❌ YouTube API Error:", error.message);
    return 0;
  }
};

/**
 * 🔍 Helper - Extract Video ID from YouTube URL
 */
const extractYouTubeVideoId = (url) => {
  try {
    const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11})(?:\?|&|$)/;
    const match = url.match(regExp);
    return match && match[1];
  } catch {
    return null;
  }
};

/**
 * 📘 Get Facebook Views via Apify
 */
export const getFacebookViews = async (facebookUrl) => {
  try {
    const input = { url: facebookUrl };

    const run = await apifyClient.actor("wpp8x7dMp9fuMVV7O").call(input);

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    const videoData = items[0];

    if (videoData?.views) {
      return parseInt(videoData.views);
    } else {
      console.warn("⚠️ No views found in Facebook data");
      return 0;
    }
  } catch (err) {
    console.error("❌ Facebook API (Apify) Error:", err.message);
    return 0;
  }
};

