export const STORAGE_KEYS = {
  CLIENT_ID: 'app_client_id',
  SESSION_ID: 'app_session_id',
};

export const getClientId = (): string => {
  let clientId = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
  if (!clientId) {
    clientId = "client_" + Math.random().toString(36).substring(7);
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId);
  }
  return clientId;
};

export const getSessionId = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  const urlSession = params.get('session_id');
  
  if (urlSession) {
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, urlSession);
    return urlSession;
  }
  return localStorage.getItem(STORAGE_KEYS.SESSION_ID) || null;
};

export const setSessionId = (sessionId: string) => {
  localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  const url = new URL(window.location.href);
  url.searchParams.set('session_id', sessionId);
  window.history.pushState({}, '', url);
};

export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  
  // 2. Remove from URL (visually)
  const url = new URL(window.location.href);
  url.searchParams.delete('session_id');
  window.history.pushState({}, '', url);
};