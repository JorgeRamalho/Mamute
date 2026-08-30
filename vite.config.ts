import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function injectViteEntry(): Plugin {
  return {
    name: "inject-vite-entry",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const next = html.replaceAll("./public/", "./");

        if (next.includes('src="./src/main.tsx"')) return next;

        return next.replace(
          "</body>",
          '    <script type="module" src="./src/main.tsx"></script>\n  </body>',
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    injectViteEntry(),
    {
      name: "ensure-bundle-in-html",
      apply: "build",
      transformIndexHtml: {
        order: "post",
        handler(html) {
          if (/<script[^>]+src=["'][^"']*\/assets\/main\.js/.test(html)) return html;
          return html.replace(
            "</body>",
            '    <script type="module" src="./assets/main.js"></script>\n  </body>',
          );
        },
      },
    },
  ],
  base: "./",
  server: {
    port: 5173,
    host: true,
    cors: true,
    proxy: {
      "/api/dj": {
        target: "http://localhost:8888",
        changeOrigin: true,
      },
      "/api/deezer": {
        target: "https://api.deezer.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deezer/, ""),
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: "index.html",
      output: {
        entryFileNames: "assets/main.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
