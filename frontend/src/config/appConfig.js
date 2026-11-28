// Application branding configuration
// Reads brand name from .env (VITE_APP_NAME).
// If missing or empty in .env, defaults strictly to 'N/A'.
export const APP_NAME = (import.meta.env.VITE_APP_NAME && import.meta.env.VITE_APP_NAME.trim())
  ? import.meta.env.VITE_APP_NAME.trim()
  : 'N/A';

export const APP_SHORT_NAME = (import.meta.env.VITE_APP_SHORT_NAME && import.meta.env.VITE_APP_SHORT_NAME.trim())
  ? import.meta.env.VITE_APP_SHORT_NAME.trim()
  : (APP_NAME !== 'N/A' ? 'IBC' : 'N/A');
