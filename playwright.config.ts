import { defineConfig, devices } from "@playwright/test";

// Click-through tests in WebKit, Safari's engine, against the static export
// in out/ (run `npm run build` first; `npm run test:e2e` does both).
const PORT = 4174;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  workers: 1,
  reporter: [["list"]],
  // Headless WebKit renders WebGL on the CPU, so the animated sky would load
  // the machine; tests run with reduced motion (one still frame) unless a
  // test asks for motion itself.
  use: { baseURL: `http://127.0.0.1:${PORT}`, reducedMotion: "reduce" },
  projects: [{ name: "webkit", use: { ...devices["Desktop Safari"] } }],
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory out`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
  },
});
