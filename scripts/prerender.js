import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../dist");

const routes = [
  "/",
  "/about",
  "/pricing",
  "/community",
  "/guides",
  "/articles/how-to-choose-the-right-goal-framework",
  "/articles/best-framework-for-career-change",
  "/articles/best-framework-for-startup-planning",
  "/articles/best-framework-for-studying",
  "/articles/best-framework-for-fitness-goals",
  "/articles/career-planning-system",
  "/articles/personal-okr-system",
  "/articles/goal-prioritization-system",
  "/articles/study-planning-system",
  "/articles/life-planning-framework",
  "/articles/okr-generator",
  "/articles/ikigai-template",
  "/articles/eisenhower-matrix-tool",
  "/articles/pareto-analysis-template",
  "/articles/career-change-planner",
  "/articles/goal-breakdown-tool",
  "/articles/example-okr-for-career-change",
  "/articles/example-study-plan-using-pareto",
  "/articles/best-goal-setting-method",
  "/articles/planning-system-for-personal-goals",
  "/articles/decision-framework-for-complex-goals",
  "/articles/life-planning-tool",
  "/articles/personal-strategy-framework",
  "/articles/priority-matrix-guide",
  "/articles/ikigai-vs-okr",
  "/articles/first-principles-vs-pareto",
  "/articles/rpm-vs-okr",
  "/articles/smart-goals-vs-eisenhower",
  "/articles/pareto-vs-eisenhower-matrix",
  "/articles/okr-vs-smart-goals",
  "/articles/vector-vs-notion-goal-planning",
  "/articles/vector-vs-trello-personal-planning",
  "/articles/okrs-in-vector-vs-spreadsheet-tracking",
  "/articles/how-to-use-pareto-for-studying",
  "/articles/how-to-use-okrs-for-personal-goals",
  "/articles/how-to-use-ikigai-for-career-clarity",
  "/articles/how-to-stop-feeling-overwhelmed",
  "/articles/how-to-prioritize-too-many-goals",
  "/articles/how-to-turn-a-vague-goal-into-a-plan",
  "/frameworks/first-principles",
  "/frameworks/pareto",
  "/frameworks/rpm",
  "/frameworks/eisenhower",
  "/frameworks/okr",
  "/frameworks/dsss",
  "/frameworks/mandalas",
  "/frameworks/gps",
  "/frameworks/misogi",
  "/frameworks/ikigai",
];

async function prerender() {
  console.log("Starting prerender...");

  // Start preview server
  const preview = spawn("npm", ["run", "preview"], {
    cwd: path.resolve(__dirname, ".."),
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let baseUrl = "";

  try {
    await new Promise((resolve, reject) => {
      const startupTimeout = setTimeout(() => {
        if (!baseUrl) reject(new Error("Timeout waiting for preview server"));
      }, 30000);

      preview.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`Preview: ${output}`);
        const plainOutput = output.replace(/\u001b\[[0-9;]*m/g, "");
        const match = plainOutput.match(/http:\/\/localhost:\d+/);
        if (match) {
          baseUrl = match[0];
          console.log(`Server started at ${baseUrl}`);
          clearTimeout(startupTimeout);
          resolve();
        }
      });

      preview.stderr.on("data", (data) =>
        console.error(`Preview Err: ${data}`),
      );

      preview.on("close", (code) => {
        clearTimeout(startupTimeout);
        if (code !== 0 && !baseUrl)
          reject(new Error(`Preview exited with code ${code}`));
      });
    });

    console.log(`Prerendering against ${baseUrl}`);
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("vector.onboarding_done", "true");
    });

    for (const route of routes) {
      console.log(`Prerendering ${route}...`);
      try {
        await page.goto(`${baseUrl}${route}`, {
          waitUntil: "networkidle0",
          timeout: 30000,
        });

        // Allow some time for animations/mounting
        await new Promise((r) => setTimeout(r, 1000));

        const html = await page.content();

        const relativePath =
          route === "/" ? "index.html" : `${route.substring(1)}/index.html`;
        const fullPath = path.join(DIST_DIR, relativePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, html);
        console.log(`Saved ${fullPath}`);
      } catch (e) {
        console.error(`Failed to prerender ${route}:`, e);
      }
    }

    await browser.close();
    console.log("Prerender complete.");
  } catch (e) {
    console.error("Prerender failed:", e);
  } finally {
    if (preview) {
      // On Windows, killing the process might require taskkill if using shell: true
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", preview.pid, "/f", "/t"]);
      } else {
        preview.kill();
      }
    }
  }
  process.exit(0);
}

prerender();
