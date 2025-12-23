// Image resolution configuration

export const THUMBNAIL_SIZES = {
  HOME_GRID: 400,
  GALLERY_GRID_PORTRAIT: 400,
  GALLERY_GRID_LANDSCAPE: 800,
  ALBUM_COVER: 800,
  VIEWER_THUMBNAIL: 100,
};

export const VIEWER_CONFIG = {
  BREAKPOINTS: [800, 1200, 1600, 2000, 2400],
  MAX_WIDTH_LANDSCAPE: 2400,
  MAX_WIDTH_PORTRAIT: 1800,
  MIN_WIDTH: 800, // Minimum width for main viewer images
};

/**
 * Calculates the optimal image width based on screen size, pixel density, and aspect ratio.
 * Used for full-screen viewers and large slideshows.
 */
export const calculateOptimalImageWidth = (
  screenWidth: number,
  pixelRatio: number,
  aspectRatio: 'landscape' | 'portrait' | 'square'
): number => {
  // Limit pixel ratio to 2x to prevent excessive image sizes
  const effectivePixelRatio = Math.min(pixelRatio || 1, 2);
  const targetWidth = screenWidth * effectivePixelRatio;
  
  // Find the first breakpoint that is larger than or equal to the target width
  let optimal = VIEWER_CONFIG.BREAKPOINTS.find(bp => bp >= targetWidth) || VIEWER_CONFIG.BREAKPOINTS[VIEWER_CONFIG.BREAKPOINTS.length - 1];

  // Apply absolute max width based on aspect ratio
  const maxWidth = aspectRatio === 'portrait' 
    ? VIEWER_CONFIG.MAX_WIDTH_PORTRAIT 
    : VIEWER_CONFIG.MAX_WIDTH_LANDSCAPE;
  
  // Ensure minimum quality
  return Math.max(Math.min(optimal, maxWidth), VIEWER_CONFIG.MIN_WIDTH);
};

/**
 * Returns the appropriate thumbnail size based on screen width.
 * For mobile devices (width < 768px), it returns a smaller size (400px) 
 * for landscape images and album covers to save bandwidth.
 */
export const getResponsiveThumbnailSize = (screenWidth: number, defaultSize: number): number => {
  const MOBILE_BREAKPOINT = 768;
  
  // If screen is smaller than md breakpoint (768px) and default size is large (800px),
  // reduce it to 400px.
  if (screenWidth < MOBILE_BREAKPOINT && defaultSize >= 800) {
    return 400;
  }
  
  return defaultSize;
};

/**
 * Returns the appropriate album cover size based on screen width.
 */
export const getResponsiveAlbumCoverSize = (screenWidth: number): number => {
  return getResponsiveThumbnailSize(screenWidth, THUMBNAIL_SIZES.ALBUM_COVER);
};
