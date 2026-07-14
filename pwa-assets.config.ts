import {
  defineConfig,
  minimal2023Preset as preset,
} from "@vite-pwa/assets-generator/config";

export default defineConfig({
  preset,
  images: [
    "public/app-icon.webp", // 👈 Path to your single 1024x1024 master icon
  ],
});
