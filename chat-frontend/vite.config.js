import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { icpBindgen } from "@icp-sdk/bindgen/plugins/vite";

function getDevServerConfig() {
  try {
    const canisterId = execSync(
      "icp canister status chat-backend -e local -i",
      { encoding: "utf-8", stdio: "pipe" }
    ).trim();
    const networkStatus = JSON.parse(
      execSync("icp network status --json", {
        encoding: "utf-8",
        stdio: "pipe",
      })
    );
    return {
      headers: {
        "Set-Cookie": `ic_env=${encodeURIComponent(
          `ic_root_key=${networkStatus.root_key}&PUBLIC_CANISTER_ID:chat-backend=${canisterId}`
        )}; SameSite=Lax;`,
      },
      proxy: {
        "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
      },
    };
  } catch {
    return {};
  }
}

export default defineConfig(({ command }) => ({
  base: "./",
  plugins: [
    react(),
    icpBindgen({
      didFile: "../chat-backend/chat_backend.did",
      outDir: "./src/bindings",
    }),
  ],
  optimizeDeps: {
    esbuildOptions: { define: { global: "globalThis" } },
  },
  server: command === "serve" ? getDevServerConfig() : undefined,
}));
