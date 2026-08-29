import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sites } from "@openai/sites-vite-plugin";

function staticSitesWorker() {
  return {
    name: "aerothai-static-sites-worker",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "server/index.js",
        source: `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== "GET") return response;
    const fallback = new URL("/index.html", request.url);
    return env.ASSETS.fetch(new Request(fallback, request));
  },
};
`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), sites(), staticSitesWorker()],
  server: { host: "127.0.0.1" },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
