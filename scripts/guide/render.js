// Telegram qo'llanma rasmlarini slides.html dan PNG qilib yaratadi (headless Chrome yoki Edge kerak).
// Ishga tushirish: node scripts/guide/render.js
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const browsers = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);
const browser = browsers.find(file => fs.existsSync(file));
if (!browser) throw new Error("Chrome yoki Edge topilmadi. CHROME_PATH ni kiriting.");

const source = path.join(__dirname, "slides.html");
const out = path.join(__dirname, "..", "..", "assets", "guide");
fs.mkdirSync(out, { recursive: true });
const count = (fs.readFileSync(source, "utf8").match(/class="slide[^"]*" data-n=/g) || []).length;
for (let n = 1; n <= count; n++) {
  const file = path.join(out, `${String(n).padStart(2, "0")}.png`);
  execFileSync(browser, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    "--window-size=1080,1350", `--screenshot=${file}`, `${pathToFileURL(source).href}#${n}`], { stdio: "ignore" });
  console.log(file);
}
