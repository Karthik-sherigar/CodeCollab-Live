/**
 * Generate a deterministic color for a user based on their ID
 * Same userId always produces the same color
 * Uses HSL for vibrant, distinguishable colors
 */
export const generateUserColor = (userId) => {
  // Hash userId to a number
  let hash = 0;
  const str = userId.toString();

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert to HSL for vibrant colors
  // Hue: 0-360 (full color spectrum)
  const hue = Math.abs(hash % 360);

  // Saturation: 70-90% (vibrant but not oversaturated)
  const saturation = 70 + (Math.abs(hash) % 20);

  // Lightness: 55-70% (bright enough to see, not too light)
  const lightness = 55 + (Math.abs(hash) % 15);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Inject CSS styles for a user's cursor color
 */
export const injectCursorStyles = (userId, color) => {
  const styleId = `cursor-style-${userId}`;
  let style = document.getElementById(styleId);

  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.textContent = `
    .remote-cursor-caret-${userId}::after {
      content: '';
      position: absolute;
      width: 2px;
      height: 1.2em;
      background-color: ${color};
      border-left: 2px solid ${color};
      margin-left: -1px;
      animation: cursor-blink-${userId} 1s infinite;
      z-index: 1000;
      pointer-events: none;
    }
    
    @keyframes cursor-blink-${userId} {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0.3; }
    }
  `;

  console.log(`✅ Injected cursor styles for user ${userId} with color ${color}`);
};

/**
 * Remove cursor styles for a user
 */
export const removeCursorStyles = (userId) => {
  const styleId = `cursor-style-${userId}`;
  const style = document.getElementById(styleId);
  if (style) {
    style.remove();
  }
};
