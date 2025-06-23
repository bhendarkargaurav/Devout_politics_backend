import axios from "axios";
import { ApifyClient } from "apify-client";

const apifyToken = 'apify_api_mChJAFaea7dGkzJghriqVBF7mOpgMA1ctxPV';
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
    const stats = response.data?.items?.[0]?.statistics || {};

    return {
      youtubeViews: parseInt(stats.viewCount || 0),
      youtubeLikes: parseInt(stats.likeCount || 0),
      youtubeComments: parseInt(stats.commentCount || 0),
    };
    // return parseInt(views, likes, comments);
  } catch (error) {
    console.error("YouTube API Error:", error.message);
    return 0;
  }
};

// Extract Video ID from YouTube URL

const extractYouTubeVideoId = (url) => {
  try {
    const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11})(?:\?|&|$)/;
    const match = url.match(regExp);
    return match && match[1];
  } catch {
    return null;
  }
};


export const getFacebookViews = async (facebookUrl) => {
  try {
    const input = { url: facebookUrl };
    const run = await apifyClient.actor("wpp8x7dMp9fuMVV7O").call(input);

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    const videoData = items[0]?.data;

     if (!videoData || !videoData.statistics) {
      console.log("⚠️ Apify output missing or invalid:", JSON.stringify(videoData));
      return {
        facebookViews: 0,
        facebookLikes: 0,
        facebookComments: 0
      };
    }

    // let views = 0;

     const views = parseInt(videoData.statistics.video_view_count || 0);
    const comments = parseInt(videoData.comment_count || 0);
    console.log("📦 reactions_details = ", JSON.stringify(videoData.reactions_details, null, 2));
    console.log("💬 comment_count = ", videoData.comment_count);

      let likes = 0;
    if (Array.isArray(videoData.reactions_details)) {
      for (const reaction of videoData.reactions_details) {
        const name = reaction?.localized_name || reaction?.node?.localized_name;
        const count = reaction?.reaction_count || reaction?.node?.reaction_count;
        if (name === "Like" && Number.isFinite(count)) {
          likes = parseInt(count);
          break;
        }
      }
    }

    console.log(`✅ Facebook Stats: Views = ${views}, Likes = ${likes}, Comments = ${comments}`);

    // Extract views from the correct location
    // if (videoData?.statistics) {
    //   if (videoData.statistics.play_count) {
    //     views = parseInt(videoData.statistics.play_count);
    //   } else if (videoData.statistics.video_view_count) {
    //     views = parseInt(videoData.statistics.video_view_count);
    //   }
    // }

    // if (isNaN(views)) {
    //   console.warn("⚠️ Facebook view count is not a valid number.");
    //   return 0;
    // }
    // return views;
     return {
      facebookViews: views,
      facebookLikes: likes,
      facebookComments: comments
    };
  } catch (err) {
    console.error("❌ Facebook API (Apify) Error:", err.message);
    return 0;
  }
};
