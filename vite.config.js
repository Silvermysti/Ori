import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for Ori.
// - The react() plugin transpiles .jsx in dev and for the production build,
//   replacing the old in-browser Babel <script> approach.
// - base: "./" makes the built asset paths relative, which is required later
//   when Capacitor loads the app from inside the Android WebView (file://).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
