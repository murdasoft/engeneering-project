/**
 * Lighthouse audit for all ecosystem projects.
 * Run: node lighthouse-audit.mjs
 *
 * Reports performance, accessibility, best practices, and SEO scores.
 */

import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECTS = [
  { name: "ConcreteMix", url: "https://concretemix.vercel.app" },
  { name: "CrackCalc", url: "https://crackcalc.vercel.app" },
  { name: "LoadBear", url: "https://loadbear.vercel.app" },
  { name: "NormBase", url: "https://normbase.vercel.app" },
  { name: "RebarDesign", url: "https://rebardesign.vercel.app" },
  { name: "EngAI Hub", url: "https://engai-hub.vercel.app" },
];

const THRESHOLDS = {
  performance: 70,
  accessibility: 85,
  "best-practices": 80,
  seo: 80,
};

async function runLighthouse(url) {
  const chrome = await launch({ chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"] });
  try {
    const options = {
      logLevel: "error",
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      port: chrome.port,
    };
    const result = await lighthouse(url, options);
    return result;
  } finally {
    await chrome.kill();
  }
}

async function main() {
  console.log("\n🔍 EngAI Ecosystem — Lighthouse QA Audit\n");
  console.log("=".repeat(70));

  const results = [];
  const reportDir = join(__dirname, "reports");
  mkdirSync(reportDir, { recursive: true });

  for (const project of PROJECTS) {
    console.log(`\n📊 Auditing ${project.name} — ${project.url}`);
    try {
      const result = await runLighthouse(project.url);
      const scores = {};
      const categories = result.lhr.categories;

      for (const [key, cat] of Object.entries(categories)) {
        const score = Math.round((cat.score || 0) * 100);
        scores[key] = score;
        const status = score >= THRESHOLDS[key] ? "✅" : "❌";
        const threshold = THRESHOLDS[key];
        console.log(`  ${status} ${key.padEnd(16)} ${String(score).padStart(3)}/100  (min: ${threshold})`);
      }

      const passed = Object.entries(scores).every(([k, v]) => v >= THRESHOLDS[k]);
      console.log(`  ${passed ? "✅ PASSED" : "❌ FAILED"} — ${project.name}`);

      const htmlReport = await import("lighthouse/report/generator/report-generator.js");
      const html = htmlReport.default.generateReport(result.lhr, "html");
      writeFileSync(join(reportDir, `${project.name.toLowerCase().replace(/\s/g, "-")}.html`), html);

      results.push({ name: project.name, url: project.url, scores, passed });
    } catch (err) {
      console.error(`  ❌ ERROR: ${err.message}`);
      results.push({ name: project.name, url: project.url, scores: {}, passed: false, error: err.message });
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("\n📋 Summary:\n");

  const summary = results.map((r) => {
    const s = r.scores;
    return {
      project: r.name,
      performance: s.performance ?? "—",
      accessibility: s.accessibility ?? "—",
      bestPractices: s["best-practices"] ?? "—",
      seo: s.seo ?? "—",
      status: r.passed ? "✅ PASS" : "❌ FAIL",
    };
  });

  console.table(summary);

  const allPassed = results.every((r) => r.passed);
  console.log(`\n${allPassed ? "✅ All projects passed QA thresholds!" : "❌ Some projects failed QA thresholds. See reports/ for details."}\n`);

  writeFileSync(join(reportDir, "summary.json"), JSON.stringify(results, null, 2));
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
