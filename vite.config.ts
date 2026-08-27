import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function injectViteEntry(): Plugin {
  return {
    name: "inject-vite-entry",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html
          .replaceAll("./public/favicon.svg", "./favicon.svg")
          .replaceAll("./public/og.svg", "./og.svg")
          .replace(
            "</body>",
            html.includes('src="./src/main.tsx"')
              ? "</body>"
              : '    <script type="module" src="./src/main.tsx"></script>\n  </body>',
          );
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), injectViteEntry()],
  base: "./",
  server: {
    port: 5173,
    host: true,
    cors: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/main.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
