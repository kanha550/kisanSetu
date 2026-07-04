export const isProduction = window.location.hostname !== 'localhost';
export const BACKEND_URL = isProduction ? 'https://kisansetu-backend-w2ni.onrender.com' : 'http://localhost:550';
export const API_BASE_URL = `${BACKEND_URL}/api`;
