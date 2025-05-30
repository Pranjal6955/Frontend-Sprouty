/**
 * Utility functions for handling images throughout the application
 */

/**
 * Returns a fallback image URL when a plant image is not available
 * @param {string} plantName - Optional plant name for customized placeholder
 * @returns {string} - URL to a placeholder image
 */
export const getPlantImageFallback = (plantName = 'Plant') => {
  // You could customize this with different fallbacks based on plant type/name
  return `https://via.placeholder.com/300x300/e5e7eb/9ca3af?text=${encodeURIComponent(plantName)}`;
};

/**
 * Processes a plant image URL to ensure it's valid and has proper format
 * @param {string} imageUrl - The image URL to process
 * @param {string} fallbackText - Text to use in fallback image
 * @returns {string} - A valid image URL or fallback
 */
export const processPlantImage = (imageUrl, fallbackText = 'Plant') => {
  if (!imageUrl) return getPlantImageFallback(fallbackText);
  
  // If it's a data URL, verify it's properly formatted
  if (imageUrl.startsWith('data:image')) {
    // Check if it appears to be a valid data URL (has the data part)
    if (!imageUrl.includes(',')) {
      console.warn('Invalid data URL format for plant image');
      return getPlantImageFallback(fallbackText);
    }
    return imageUrl;
  }
  
  // If it's a URL, ensure it has proper protocol
  if (imageUrl.startsWith('//')) {
    return `https:${imageUrl}`;
  }
  
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    // If it's a relative URL, make it absolute
    if (imageUrl.startsWith('/')) {
      return `${window.location.origin}${imageUrl}`;
    }
    // Otherwise add https protocol
    return `https://${imageUrl}`;
  }
  
  return imageUrl;
};

/**
 * Error handler for image loading failures
 * @param {Event} event - The error event
 * @param {string} plantName - Name of the plant for the fallback
 */
export const handleImageError = (event, plantName = 'Plant') => {
  console.warn(`Failed to load image${plantName ? ' for ' + plantName : ''}`);
  event.target.src = getPlantImageFallback(plantName);
};
