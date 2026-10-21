import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const SCREENSHOT_DIR = "qa-visual-verify";
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVisualVerification() {
  console.log("Launching browser for visual verification...");
  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  const consoleLogs = [];
  const failedRequests = [];

  page.on("console", (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === "error") {
      console.error(`[Console Error]: ${msg.text()}`);
    }
  });

  page.on("requestfailed", (req) => {
    failedRequests.push({ url: req.url(), failure: req.failure() });
    console.error(`[Request Failed]: ${req.url()} - ${req.failure()?.errorText}`);
  });

  console.log("Navigating to http://localhost:5174 ...");
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });

  // 1. Check Login Page
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-login-screen.png") });

  // Unlock with valid DOB 18/10/02
  const dobInput = await page.waitForSelector("input#dob");
  await dobInput.fill("181002");
  const unlockBtn = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");
  await unlockBtn.click();

  // 2. Birthday Reveal & Heart Scene
  await page.waitForSelector(".heart-scene");
  await page.waitForTimeout(500);

  // Measure main heart element and animation
  const heartData = await page.evaluate(() => {
    const wrapper = document.querySelector(".wrapper");
    const heart = document.querySelector(".wrapper .heart");
    const wStyle = window.getComputedStyle(wrapper);
    const hStyle = window.getComputedStyle(heart);
    const rect = heart.getBoundingClientRect();
    return {
      wrapperAnimation: `${wStyle.animationName} ${wStyle.animationDuration} ${wStyle.animationTimingFunction}`,
      heartAnimation: `${hStyle.animationName} ${hStyle.animationDuration}`,
      width: hStyle.width,
      height: hStyle.height,
      backgroundColor: hStyle.backgroundColor,
      rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
    };
  });
  console.log("Main Heart Data:", JSON.stringify(heartData, null, 2));

  // Record 5 frames of the heart pulse over 1.4s
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(280);
    const frameScale = await page.evaluate(() => {
      const wrapper = document.querySelector(".wrapper");
      return window.getComputedStyle(wrapper).transform;
    });
    console.log(`Heart pulse frame ${i + 1} transform: ${frameScale}`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-heart-scene.png") });

  // 3. Move to Cake Scene
  const continueBtn = await page.waitForSelector('button:has-text("Continue the Magic ✨")');
  await continueBtn.click();
  await page.waitForSelector("text=Make a Wish, Bestie! 🎂");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-cake-intro.png") });

  const cutBtn = await page.waitForSelector('button:has-text("Let\'s Cut the Cake 🎂")');
  await cutBtn.click();
  await page.waitForSelector("text=YAYYYY! 🎉 The cake has officially been cut!");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-cake-cut.png") });

  // 4. Move to Gifts Scene & Test Gift Boxes Individually
  const giftsBtn = await page.waitForSelector('button:has-text("Open Your Gifts 🎁")');
  await giftsBtn.click();
  await page.waitForSelector("text=Your Birthday Gifts Are Here! 🎁");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-gifts-closed.png") });

  // Open Gift 1
  const gift1 = await page.waitForSelector('[role="button"]:has-text("Open Funny Gift")');
  await gift1.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-gift1-opened.png") });

  // Open Gift 2
  const gift2 = await page.waitForSelector('[role="button"]:has-text("Open Friendship Gift")');
  await gift2.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-gift2-opened.png") });

  // Open Gift 3 (Bouquet)
  const gift3 = await page.waitForSelector('[role="button"]:has-text("Open Bouquet Gift 💐")');
  await gift3.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-gift3-bouquet-opened.png") });

  // Open Gift 4 (Album)
  const gift4 = await page.waitForSelector('[role="button"]:has-text("Open Our Memories ❤️")');
  await gift4.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-gift4-album-opened.png") });

  // Check flower pop-up bouquet measurements in gift boxes
  const flowerMetrics = await page.evaluate(() => {
    const containers = Array.from(document.querySelectorAll(".gift-flowers-container"));
    return containers.map((c, idx) => {
      const rect = c.getBoundingClientRect();
      const style = window.getComputedStyle(c);
      return {
        boxIndex: idx + 1,
        width: rect.width,
        height: rect.height,
        opacity: style.opacity,
        transform: style.transform,
        classList: Array.from(c.classList),
      };
    });
  });
  console.log("Flower bouquet metrics in boxes:", JSON.stringify(flowerMetrics, null, 2));

  // 5. Move to Album Scene & Inspect Font Awesome Heart
  const discoverBtn = await page.waitForSelector('button:has-text("Discover Our Memories 📸")');
  await discoverBtn.click();
  await page.waitForSelector("text=Our Little World of Memories ❤️");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10-album-cover.png") });

  const openBookBtn = await page.waitForSelector('button:has-text("Click to Open Scrapbook 📖")');
  await openBookBtn.click();
  await page.waitForSelector("text=Page 1 of 4");
  await page.waitForTimeout(400);

  // Inspect Font Awesome Heart Icon in Photo Scene
  const faHeartData = await page.evaluate(() => {
    const heart = document.getElementById("heart");
    if (!heart) return { exists: false };
    const style = window.getComputedStyle(heart);
    const beforeStyle = window.getComputedStyle(heart, "::before");
    const rect = heart.getBoundingClientRect();
    return {
      exists: true,
      tagName: heart.tagName,
      className: heart.className,
      color: style.color,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      animationName: style.animationName,
      animationDuration: style.animationDuration,
      beforeContent: beforeStyle.content,
      width: rect.width,
      height: rect.height,
    };
  });
  console.log("Font Awesome Heart Data in Photo Scene:", JSON.stringify(faHeartData, null, 2));

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "11-album-page1-fa-heart.png") });

  // Test pagination Next / Prev
  const nextBtn = await page.waitForSelector('button:has-text("Next")');
  await nextBtn.click();
  await page.waitForSelector("text=Page 2 of 4");
  await nextBtn.click();
  await page.waitForSelector("text=Page 3 of 4");
  await nextBtn.click();
  await page.waitForSelector("text=Page 4 of 4");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "12-album-page4.png") });

  // 6. Final Letter & Virtual Hug
  const surpriseBtn = await page.waitForSelector('button:has-text("One Last Surprise 💝")');
  await surpriseBtn.click();
  await page.waitForSelector("text=Dear Bestie, ❤️");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "13-final-letter.png") });

  const hugBtn = await page.waitForSelector('button:has-text("Send a Virtual Birthday Hug 🤗")');
  await hugBtn.click();
  await page.waitForSelector("text=Virtual Hug Delivered Successfully! 🤗❤️");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "14-virtual-hug.png") });

  // Replay
  const replayBtn = await page.waitForSelector('button:has-text("Replay Our Midnight Magic 🔄")');
  await replayBtn.click();
  await page.waitForSelector(".heart-scene");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "15-replayed-heart.png") });

  console.log("\nSummary of Console Errors:", consoleLogs.filter(c => c.type === "error"));
  console.log("Summary of Failed Requests:", failedRequests);

  await browser.close();
  console.log("\nVisual verification script completed successfully!");
}

runVisualVerification().catch((err) => {
  console.error("Visual verification failed:", err);
  process.exit(1);
});
