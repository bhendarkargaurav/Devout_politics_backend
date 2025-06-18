import axios from "axios";
import { ApifyClient } from "apify-client";

// API Keys
const apifyToken = 'apify_api_7IhxsARIYIzV1p0YlVNPtEJshT0nnh1IcWAM';
const youtubeApiKey = 'AIzaSyASyv089yEe9a5CXGB2OHYbGVD0oCLC0vA';

// Initialize Apify client
const apifyClient = new ApifyClient({ token: apifyToken });


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
export const AgetFacebookViews = async (facebookUrl) => {
  try {
    const input = { url: facebookUrl };

    // const run = await apifyClient.actor("wpp8x7dMp9fuMVV7O").call(input);
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




//view not listed
// export const getFacebookViews = async (facebookUrl) => {
//   try {
//     const input = { url: facebookUrl };
//     const run = await apifyClient.actor("wpp8x7dMp9fuMVV7O").call(input);

//     const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
//     console.log("item is aaaaaa", items);
//     const videoData = items[0]?.data;

//     console.log("viewdata is:", videoData)
//     // Try getting views from nested objects
//     const views = videoData?.video_details?.view_count ||
//                   videoData?.statistics?.view_count ||
//                   videoData?.video_details?.views;

//     if (views) {
//       return parseInt(views);
//     } else {
//       console.warn("⚠️ No view count found in nested fields.");
//       console.log("📊 Actor raw output:", videoData);
//       return 0;
//     }
//   } catch (err) {
//     console.error("❌ Facebook API (Apify) Error:", err.message);
//     return 0;
//   }
// };


export const getFacebookViews = async (facebookUrl) => {
  try {
    const input = { url: facebookUrl };
    const run = await apifyClient.actor("wpp8x7dMp9fuMVV7O").call(input);

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    const videoData = items[0]?.data;

    console.log("📊 Facebook videoData:", JSON.stringify(videoData, null, 2));

    let views = 0;

    // ✅ Extract views from the correct location
    if (videoData?.statistics) {
      if (videoData.statistics.play_count) {
        views = parseInt(videoData.statistics.play_count);
      } else if (videoData.statistics.video_view_count) {
        views = parseInt(videoData.statistics.video_view_count);
      }
    }

    if (isNaN(views)) {
      console.warn("⚠️ Facebook view count is not a valid number.");
      return 0;
    }

    return views;
  } catch (err) {
    console.error("❌ Facebook API (Apify) Error:", err.message);
    return 0;
  }
};

