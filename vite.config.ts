/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const REPO_NAME = "thumbnail-creator-agol";

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
