/**
 * A custom hook that provides a reusable state for managing aspect ratios of media elements
 * such as pictures, videos, or streams.
 *
 * @param initialRatio - The initial aspect ratio (default is 16:9)
 * @returns An object containing the current ratio and a function to update it
 */

// src/config/camera.ts
// FIX: Use explicit width/height for portrait mode (height > width)
export const CAMERA_CONFIG = {
  mobile: {
    width: { ideal: 640 },
    height: { ideal: 800 }, // 5:4 portrait (height > width)
  },
  desktop: {
    width: { ideal: 640 },
    height: { ideal: 800 }, // 5:4 portrait (height > width)
  },
};
