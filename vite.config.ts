import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "inline", // Inlines the background daemon script to satisfy mobile engines instantly
      filename: "manifest.json", // FORCE JSON file suffix to fix iOS Simulator local IP network bugs
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      devOptions: {
        enabled: true, // Forces manifest injection pipelines to compile during 'npm run dev'
      },
      manifest: {
        name: "My broker - Rental plug", // Full branding title for Android download screen
        short_name: "My Broker", // Fits neatly under mobile app shortcut icons
        description:
          "Comprehensive property broker platform and rental management app.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone", // Requests the OS window container to strip out all browser UI chrome
        orientation: "portrait",
        start_url: "/", // Secure domain anchor path necessary for installation prompts
        scope: "/", // Tells the system to keep every interior page running in full screen
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable", // Smoothly shapes adaptive icons to match custom Android masks
          },
        ],
      },
    }),
  ],
});
