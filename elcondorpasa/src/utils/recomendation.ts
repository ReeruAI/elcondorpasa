const RECOMMENDATIONS_LOADED_KEY = "yourclip_recommendations_loaded";
const RECOMMENDATIONS_DATA_KEY = "yourclip_recommendations_data";
const RECOMMENDATIONS_TIMESTAMP_KEY = "yourclip_recommendations_timestamp";
const REFRESH_USED_KEY = "yourclip_refresh_used";
const REFRESH_USED_TIMESTAMP_KEY = "yourclip_refresh_timestamp";
const USER_ID_KEY = "yourclip_current_user";

// Function to clear user data
export const clearUserRecommendationData = () => {
  localStorage.removeItem(RECOMMENDATIONS_LOADED_KEY);
  localStorage.removeItem(RECOMMENDATIONS_DATA_KEY);
  localStorage.removeItem(RECOMMENDATIONS_TIMESTAMP_KEY);
  localStorage.removeItem(REFRESH_USED_KEY);
  localStorage.removeItem(REFRESH_USED_TIMESTAMP_KEY);
  localStorage.removeItem(USER_ID_KEY);
};
