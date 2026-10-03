/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_TIKTOK_API_URL?: string;
  readonly VITE_FEED_BACKEND_ENABLED?: string;
  readonly VITE_FEED_TIKTOK_ENABLED?: string;
}
