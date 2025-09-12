/**
 * Navigation utility functions to handle page refreshing
 */

/**
 * Navigate to a path with a full page refresh
 * @param {string} path - The path to navigate to
 */
export const navigateWithRefresh = (path) => {
  window.location.href = path;
};

/**
 * Add refresh functionality to a regular React Router navigation
 * @param {function} navigate - The navigate function from useNavigate hook
 * @param {string} path - The path to navigate to
 */
export const navigateAndRefresh = (navigate, path) => {
  // Clear any component state that might be persisted
  sessionStorage.setItem('forceRefresh', 'true');
  // Use full page refresh instead of client-side navigation
  window.location.href = path;
};

/**
 * Reset all form data or component state
 */
export const resetPageData = () => {
  // Clear any form data or component state
  sessionStorage.removeItem('formData');
  sessionStorage.removeItem('appState');
  
  // Force a refresh by adding a timestamp query parameter
  const currentPath = window.location.pathname;
  const timestamp = new Date().getTime();
  window.location.href = `${currentPath}?t=${timestamp}`;
};

/**
 * Create a full URL with refresh parameter
 * @param {string} path - The path to navigate to
 * @returns {string} URL with timestamp
 */
export const createRefreshUrl = (path) => {
  const timestamp = new Date().getTime();
  return `${path}?refresh=${timestamp}`;
}; 