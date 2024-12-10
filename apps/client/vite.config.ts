import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// const ReactCompilerConfig = {/* ... */ };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    babel: {
      plugins: [
        [
          "babel-plugin-react-compiler",
          //  ReactCompilerConfig
          ]
        ],
    },
  })],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
