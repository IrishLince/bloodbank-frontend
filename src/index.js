import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Force fresh rendering on every page load
window.addEventListener('pageshow', (event) => {
  // If the page is loaded from the browser cache (back/forward navigation)
  if (event.persisted) {
    // Force a reload to ensure fresh data
    window.location.reload();
  }
});

// Clear any stale session data that might affect rendering
if (sessionStorage.getItem('forceRefresh') === 'true') {
  sessionStorage.removeItem('forceRefresh');
  // Force a repaint by adding a temporary class to body
  document.body.classList.add('force-repaint');
  setTimeout(() => {
    document.body.classList.remove('force-repaint');
  }, 0);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);