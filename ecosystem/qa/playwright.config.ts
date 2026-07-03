import { defineConfig, devices } from "@playwright/test";

const PROJECTS = [
  { name: "ConcreteMix", url: "https://concretemix.vercel.app", port: 3001 },
  { name: "CrackCalc", url: "https://crackcalc.vercel.app", port: 3002 },
  { name: "LoadBear", url: "https://loadbear.vercel.app", port: 3003 },
  { name: "NormBase", url: "https://normbase.vercel.app", port: 3004 },
  { name: "RebarDesign", url: "https://rebardesign.vercel.app", port: 3005 },
  { name: "EngAI Hub", url: "https://engai-hub.vercel.app", port: 3006 },
];

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    headless: true,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: PROJECTS.map((p) => ({
    name: p.name,
    use: {
      ...devices["Desktop Chrome"],
      baseURL: p.url,
      projectMeta: { name: p.name, url: p.url },
    },
  })),
});
