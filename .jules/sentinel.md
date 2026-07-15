## 2024-05-18 - Exposed API Key in Vite Config
**Vulnerability:** Found `GEMINI_API_KEY` explicitly exposed to the client bundle via `define: { 'process.env.GEMINI_API_KEY': ... }` in `apps/web/vite.config.ts`.
**Learning:** Configurations in `vite.config.ts` using `define` directly inject environment variables into the static frontend bundle, making them accessible to any client. The key was injected but completely unused in the frontend code, suggesting leftover configuration from an abandoned feature.
**Prevention:** Never use `define` in `vite.config.ts` to inject sensitive backend secrets (like `GEMINI_API_KEY`). If a frontend needs an AI service, route those requests through a secure backend proxy to keep the API key on the server.
