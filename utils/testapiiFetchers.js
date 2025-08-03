import axios from "axios";
import dotenv, { config } from "dotenv";
import { ApifyClient } from "apify-client";

dotenv.config();

const apifyToken = process.env.APIFY_API_TOKEN;
const youtubeApiKey = process.env.YOUTUBE_API_TOKEN;
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
    console.log("error", error);
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

    let views = 0;
    let comments = 0;
    let likes = 0

    // Extract views from the correct location
    if (videoData?.statistics) {
      if (videoData.statistics.play_count) {
        views = parseInt(videoData.statistics.play_count);
        likes = parseInt(videoData.statistics.reaction_count.count);
        comments = parseInt(videoData.statistics.comment_count);
      } else if (videoData.statistics.video_view_count) {
        views = parseInt(videoData.statistics.video_view_count);
        likes = parseInt(videoData.statistics.reaction_count.count);
        comments = parseInt(videoData.statistics.comment_count);
      }
    }

    if (isNaN(views)) {
      console.warn("Facebook view count is not a valid number.");
      return 0;
    }
    if (isNaN(likes)) {
      console.warn("Facebook likes count is not a valid number.");
      return 0;
    }
    if (isNaN(comments)) {
      console.warn("Facebook comments count is not a valid number.");
      return 0;
    }

    return {
      views, 
      likes,
      comments,
    }
  } catch (err) {
    console.error("Facebook API (Apify) Error:", err.message);
    return 0;
  }
};
