function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

const toBool = (raw?: string) => {
  const normalized = raw?.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

const rawApi = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';
const rawChat = import.meta.env.VITE_CHAT_WS_URL?.trim();

/** Client-safe config. */
export const env = {
  apiUrl: stripTrailingSlashes(rawApi),
  /** Optional; defaults to api URL. */
  chatWsUrl: stripTrailingSlashes(rawChat || rawApi),
  googleWebClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID?.trim() ?? '',
  debug: toBool(import.meta.env.VITE_DEBUG),
} as const;
