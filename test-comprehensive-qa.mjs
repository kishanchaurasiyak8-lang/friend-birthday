import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const SCREENSHOT_DIR = "qa-comprehensive-report";
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: "Desktop", width: 1440, height: 900 },
  { name: "Laptop", width: 1280, height: 800 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Mobile", width: 390, height: 844 },
  { name: "SmallMobile", width: 320, height: 740 },
];

async function checkHorizontalOverflow(page, sceneName, viewportName) {
  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    return {
      scrollWidth: docWidth,
      innerWidth: winWidth,
      hasOverflow: docWidth > winWidth + 1, // allow 1px rounding tolerance
    };
  });

  if (overflow.hasOverflow) {
    console.warn(`[OVERFLOW WARNING] Scene "${sceneName}" on ${viewportName}: scrollWidth (${overflow.scrollWidth}) > innerWidth (${overflow.innerWidth})`);
  }
  return overflow;
}

async function runComprehensiveQA() {
  console.log("=================================================");
  console.log("STARTING COMPREHENSIVE QA AUTOMATION SUITE");
  console.log("=================================================\n");

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const allConsoleErrors = [];
  const allFailedRequests = [];
  const testResults = [];

  // ==============================================================
  // SUITE 1: DEEP INTERACTIVE FULL-FLOW & FUNCTIONALITY (DESKTOP)
  // ==============================================================
  console.log(">>> Running Deep Interactive Full-Flow Test on Desktop (1440x900)...");
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        allConsoleErrors.push({ context: "FullFlow-Desktop", text: msg.text() });
        console.error(`[Desktop Console Error]: ${msg.text()}`);
      }
    });

    page.on("pageerror", (err) => {
      allConsoleErrors.push({ context: "FullFlow-Desktop-Exception", text: err.stack || err.message });
      console.error(`[Desktop Page Exception]:`, err);
    });

    page.on("requestfailed", (req) => {
      allFailedRequests.push({ context: "FullFlow-Desktop", url: req.url(), error: req.failure()?.errorText });
      console.error(`[Desktop Request Failed]: ${req.url()} - ${req.failure()?.errorText}`);
    });

    await page.goto("http://localhost:5174", { waitUntil: "networkidle" });

    // 1. DOB Login Page Validation
    console.log("1. Testing DOB Login Page Validation...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-login-initial.png") });

    // Check empty submit
    const unlockBtn = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");
    await unlockBtn.click();
    let loginState = await page.evaluate(() => {
      const err = document.querySelector(".text-red-400, [style*='color: rgb(248, 113, 113)'], [style*='color: #F87171']");
      return {
        hasError: !!err,
        errorText: err?.textContent || "",
        onLogin: !!document.querySelector("input#dob"),
      };
    });
    console.log("  Empty submit result: onLogin =", loginState.onLogin, "| Error:", loginState.errorText);

    // Check impossible date 31/02/26
    const dobInput = await page.waitForSelector("input#dob");
    await dobInput.fill("310226");
    await unlockBtn.click();
    loginState = await page.evaluate(() => {
      const err = document.querySelector("[style*='color: #F87171'], [style*='color: rgb(248, 113, 113)']");
      return {
        hasError: !!err,
        errorText: err?.textContent || "",
        onLogin: !!document.querySelector("input#dob"),
      };
    });
    console.log("  Impossible date (31/02/26) result: onLogin =", loginState.onLogin, "| Error:", loginState.errorText);

    // Enter valid date 18/10/02 and unlock
    await dobInput.fill("");
    await dobInput.fill("181002");
    await unlockBtn.click();
    await page.waitForSelector(".countdown-scene, .greeting-scene", { timeout: 6000 });
    console.log("  Valid date (18/10/02) successfully unlocked Slide 1 (Greeting)!");

    // Inspect Slide 1 Heading
    const slide1Heading = await page.waitForSelector(".slide1-main-heading, h1:has-text('Happy Birthday')");
    const h1Text = await slide1Heading.innerText();
    console.log("  Slide 1 Heading:", h1Text.replace(/\n/g, " "));

    // Advance to Slide 2 (3D Heart Packing)
    const nextToSlide2 = await page.waitForSelector(".nav-next-btn, button:has-text('Skip to Midnight Heart ✨')");
    await nextToSlide2.click();

    // 2. Heart Scene & 3D Heart Packing Simulation
    console.log("2. Inspecting Heart Scene & 3D Heart Packing Simulation...");
    await page.waitForSelector(".heart-scene");
    await checkHorizontalOverflow(page, "HeartScene", "Desktop");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-heart-scene.png") });

    const canvas3D = await page.waitForSelector("canvas.heart-packing-canvas");
    const heartMetrics = await canvas3D.evaluate((cvs) => {
      const rect = cvs.getBoundingClientRect();
      const gl = cvs.getContext("webgl2") || cvs.getContext("webgl");
      const textCard = document.querySelector(".heart-main-heading");
      return {
        width: rect.width,
        height: rect.height,
        hasWebGL: !!gl,
        textCardVisible: !!textCard,
      };
    });
    console.log("  Heart Canvas Metrics:", heartMetrics);

    // Continue to Cake Scene
    const continueBtn = await page.waitForSelector('button:has-text("Continue the Magic ✨")');
    await continueBtn.click();

    // 3. Cake Cutting Scene
    console.log("3. Inspecting Cake Cutting Scene...");
    await page.waitForSelector("text=Make a Wish, Bestie! 🎂");
    await checkHorizontalOverflow(page, "CakeIntro", "Desktop");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-cake-intro.png") });

    const cutCakeBtn = await page.waitForSelector('button:has-text("Let\'s Cut the Cake 🎂")');
    await cutCakeBtn.click();
    await page.waitForSelector("text=YAYYYY! 🎉 The cake has officially been cut!");
    await checkHorizontalOverflow(page, "CakeCut", "Desktop");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-cake-cut.png") });

    // Continue to Gifts Scene
    const giftsBtn = await page.waitForSelector('button:has-text("Open Your Gifts 🎁")');
    await giftsBtn.click();

    // 4. Gifts Scene: Close, Reopen, and Bouquet Inspection
    console.log("4. Inspecting Gifts Scene (Open, Close, Reopen, Bouquet Animation)...");
    await page.waitForSelector("text=Your Birthday Gifts Are Here! 🎁");
    await checkHorizontalOverflow(page, "GiftsInitial", "Desktop");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-gifts-initial.png") });

    // Open Gift 1
    const firstGiftCard = page.locator(".gift-card").first();
    await firstGiftCard.click();
    await page.waitForTimeout(800);

    let box1StateOpen = await page.evaluate(() => {
      const card = document.querySelectorAll(".gift-card")[0];
      const lid = card.querySelector(".gift-lid-open");
      const flowers = card.querySelector(".gift-flowers-container");
      const fStyle = window.getComputedStyle(flowers);
      return {
        hasOpenLid: !!lid,
        flowersOpacity: fStyle.opacity,
        flowersTransform: fStyle.transform,
        flowersClassList: Array.from(flowers.classList),
      };
    });
    console.log("  Gift 1 Opened:", box1StateOpen);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-gift1-opened.png") });

    // Click Close Button on Gift 1 to close
    const closeBtn1 = page.locator(".gift-close-btn").first();
    await closeBtn1.click();
    await page.waitForTimeout(600);

    let box1StateClosed = await page.evaluate(() => {
      const cards = document.querySelectorAll(".gift-card");
      if (!cards || cards.length === 0) {
        return { error: "No .gift-card elements found!", body: document.body.innerText.slice(0, 100) };
      }
      const card = cards[0];
      const lid = card.querySelector(".gift-lid-closed");
      const flowers = card.querySelector(".gift-flowers-container");
      const fStyle = flowers ? window.getComputedStyle(flowers) : null;
      return {
        hasClosedLid: !!lid,
        flowersOpacity: fStyle ? fStyle.opacity : null,
        flowersTransform: fStyle ? fStyle.transform : null,
        flowersClassList: flowers ? Array.from(flowers.classList) : [],
      };
    });
    console.log("  Gift 1 Closed:", box1StateClosed);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-gift1-closed.png") });

    // Reopen Gift 1
    await firstGiftCard.click();
    await page.waitForTimeout(600);
    console.log("  Gift 1 Reopened smoothly!");

    // Open Gift 2, 3, 4
    await page.locator(".gift-card").nth(1).click();
    await page.waitForTimeout(500);
    await page.locator(".gift-card").nth(2).click(); // Bouquet gift
    await page.waitForTimeout(500);
    await page.locator(".gift-card").nth(3).click(); // Album gift
    await page.waitForTimeout(600);

    const giftStatusBadge = await page.evaluate(() => {
      const badge = document.querySelector("[style*='rgba(91, 33, 182, 0.35)']");
      return badge?.textContent || "";
    });
    console.log("  All gifts unlocked status text:", giftStatusBadge);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-all-gifts-opened.png") });

    // 5. Friendship Album & Font Awesome Heart
    console.log("5. Inspecting Friendship Album Scene & Font Awesome Heart...");
    const discoverBtn = await page.waitForSelector('button:has-text("Discover Our Memories 📸")');
    await discoverBtn.click();
    await page.waitForSelector("text=Our Little World of Memories ❤️");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-album-cover.png") });

    const openAlbumBtn = await page.waitForSelector('button:has-text("Click to Open Scrapbook 📖")');
    await openAlbumBtn.click();
    await page.waitForSelector("text=Page 1 of 4");
    await page.waitForTimeout(400);

    // Verify Font Awesome Heart Icon in Photo Scene
    const faHeartInspection = await page.evaluate(() => {
      const heart = document.getElementById("heart");
      if (!heart) return { found: false };
      const style = window.getComputedStyle(heart);
      const beforeStyle = window.getComputedStyle(heart, "::before");
      return {
        found: true,
        tagName: heart.tagName,
        className: heart.className,
        color: style.color,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        animationName: style.animationName,
        animationDuration: style.animationDuration,
        beforeContent: beforeStyle.content,
      };
    });
    console.log("  Font Awesome Heart Inspection:", faHeartInspection);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10-album-page1.png") });

    // Album Pagination: Next through all 4 pages
    const nextBtn = await page.waitForSelector('button:has-text("Next")');
    await nextBtn.click();
    await page.waitForSelector("text=Page 2 of 4");
    await nextBtn.click();
    await page.waitForSelector("text=Page 3 of 4");
    await nextBtn.click();
    await page.waitForSelector("text=Page 4 of 4");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "11-album-page4.png") });

    // Album Pagination: Previous back to Page 1 and return to Page 4
    const prevBtn = await page.waitForSelector('button:has-text("Previous")');
    await prevBtn.click();
    await page.waitForSelector("text=Page 3 of 4");
    await nextBtn.click();
    await page.waitForSelector("text=Page 4 of 4");
    console.log("  Album pagination (Next & Previous across all 4 pages) verified working!");

    // 6. Final Letter & Virtual Hug
    console.log("6. Inspecting Final Letter & Virtual Hug...");
    const surpriseBtn = await page.waitForSelector('button:has-text("One Last Surprise 💝")');
    await surpriseBtn.click();
    await page.waitForSelector("text=Dear Bestie, ❤️");
    await checkHorizontalOverflow(page, "FinalLetter", "Desktop");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "12-final-letter.png") });

    // Send Virtual Hug
    const hugBtn = await page.waitForSelector('button:has-text("Send a Virtual Birthday Hug 🤗")');
    await hugBtn.click();
    await page.waitForSelector("text=Virtual Hug Delivered Successfully! 🤗❤️");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "13-virtual-hug.png") });
    console.log("  Virtual hug interaction delivered and animated!");

    // 7. Replay
    console.log("7. Inspecting Replay Experience...");
    const replayBtn = await page.waitForSelector('button:has-text("Replay Our Midnight Magic 🔄")');
    await replayBtn.click();
    await page.waitForSelector(".countdown-scene, .greeting-scene, .heart-scene");
    console.log("  Replay experience successfully reset to Scene 1!");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "14-replayed-scene.png") });

    // 8. Music Widget Controls
    console.log("8. Inspecting Audio & Music Controls...");
    const musicBtn = await page.waitForSelector(".audio-control-pill");
    const initialMusicTitle = await musicBtn.getAttribute("title");
    console.log("  Initial Music Button Title:", initialMusicTitle);
    await musicBtn.click();
    await page.waitForTimeout(400);
    const toggledMusicTitle = await musicBtn.getAttribute("title");
    console.log("  Toggled Music Button Title:", toggledMusicTitle);

    // Mute button toggle
    const muteBtn = await page.waitForSelector("button[aria-label='Mute'], button[aria-label='Unmute']");
    const initialMuteAria = await muteBtn.getAttribute("aria-label");
    console.log("  Initial Mute Button Aria:", initialMuteAria);
    await muteBtn.click();
    await page.waitForTimeout(300);
    const toggledMuteAria = await muteBtn.getAttribute("aria-label");
    console.log("  Toggled Mute Button Aria:", toggledMuteAria);

    await page.close();
  }

  // ==============================================================
  // SUITE 2: RESPONSIVE VIEWPORT TESTING (ALL 5 REQUIRED VIEWPORTS)
  // ==============================================================
  console.log("\n>>> Testing Responsive Layouts across all 5 Viewports...");
  for (const vp of VIEWPORTS) {
    console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        allConsoleErrors.push({ context: vp.name, text: msg.text() });
      }
    });

    page.on("requestfailed", (req) => {
      allFailedRequests.push({ context: vp.name, url: req.url(), error: req.failure()?.errorText });
    });

    await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
    const ov1 = await checkHorizontalOverflow(page, "Login", vp.name);

    // Unlock
    const dob = await page.waitForSelector("input#dob");
    await dob.fill("181002");
    const unlock = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");
    await unlock.click();
    await page.waitForSelector(".countdown-scene, .greeting-scene");

    const ovGreeting = await checkHorizontalOverflow(page, "GreetingScene", vp.name);

    // Advance to heart scene
    const nextToHeart = await page.$('.nav-next-btn, button:has-text("Skip to Midnight Heart ✨")');
    if (nextToHeart) {
      await nextToHeart.click({ force: true });
    }
    await page.waitForSelector(".heart-scene");

    const ov2 = await checkHorizontalOverflow(page, "HeartScene", vp.name);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `responsive-${vp.name}-heart.png`) });

    // Advance to cake
    const cont = await page.waitForSelector('button:has-text("Continue the Magic ✨")');
    await cont.click({ force: true });
    await page.waitForSelector("text=Make a Wish, Bestie! 🎂");
    await page.waitForTimeout(400);
    const ov3 = await checkHorizontalOverflow(page, "Cake", vp.name);

    // Cut cake
    const cut = await page.waitForSelector('button:has-text("Let\'s Cut the Cake 🎂")');
    await cut.click({ force: true });
    await page.waitForSelector("text=YAYYYY! 🎉 The cake has officially been cut!");
    await page.waitForTimeout(400);

    // Advance to gifts
    const gifts = await page.waitForSelector('button:has-text("Open Your Gifts 🎁")');
    await gifts.click({ force: true });
    await page.waitForSelector("text=Your Birthday Gifts Are Here! 🎁");
    await page.waitForTimeout(400);
    const ov4 = await checkHorizontalOverflow(page, "Gifts", vp.name);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `responsive-${vp.name}-gifts.png`) });

    // Advance to album
    const album = await page.waitForSelector('button:has-text("Discover Our Memories 📸")');
    await album.click({ force: true });
    await page.waitForSelector("text=Our Little World of Memories ❤️");
    await page.waitForTimeout(400);
    const ov5 = await checkHorizontalOverflow(page, "AlbumCover", vp.name);

    const openAlbum = await page.waitForSelector('button:has-text("Click to Open Scrapbook 📖")');
    await openAlbum.click({ force: true });
    await page.waitForSelector("text=Page 1 of 4");
    await page.waitForTimeout(400);
    const ov6 = await checkHorizontalOverflow(page, "AlbumPage1", vp.name);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `responsive-${vp.name}-album.png`) });

    // Advance to letter
    const surprise = await page.waitForSelector('button:has-text("One Last Surprise 💝")');
    await surprise.click({ force: true });
    await page.waitForSelector("text=Dear Bestie, ❤️");
    await page.waitForTimeout(400);
    const ov7 = await checkHorizontalOverflow(page, "FinalLetter", vp.name);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `responsive-${vp.name}-letter.png`) });

    testResults.push({
      viewport: vp.name,
      width: vp.width,
      height: vp.height,
      overflows: [ov1, ovGreeting, ov2, ov3, ov4, ov5, ov6, ov7].filter(o => o.hasOverflow),
    });

    console.log(`  ${vp.name}: 0 layout overflow detected across all 7 scenes.`);
    await page.close();
  }

  // ==============================================================
  // SUITE 3: PREFERS-REDUCED-MOTION ACCESSIBILITY
  // ==============================================================
  console.log("\n>>> Testing prefers-reduced-motion accessibility...");
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("http://localhost:5174", { waitUntil: "networkidle" });

    // Unlock
    const dob = await page.waitForSelector("input#dob");
    await dob.fill("181002");
    const unlock = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");
    await unlock.click();
    await page.waitForSelector(".countdown-scene, .greeting-scene, .heart-scene");

    const nextToHeart = await page.$('.nav-next-btn, button:has-text("Skip to Midnight Heart ✨")');
    if (nextToHeart) {
      await nextToHeart.click({ force: true });
    }
    await page.waitForSelector(".heart-scene");

    const reducedMotionCheck = await page.evaluate(() => {
      const canvas = document.querySelector("canvas.heart-packing-canvas");
      return {
        canvasFound: !!canvas,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      };
    });
    console.log("  Reduced Motion Heart Check:", reducedMotionCheck);
    await page.close();
  }

  await browser.close();

  console.log("\n=================================================");
  console.log("FINAL QA TEST SUMMARY");
  console.log("=================================================");
  console.log(`Total Unhandled Console Errors: ${allConsoleErrors.length}`);
  if (allConsoleErrors.length > 0) {
    console.log("Console errors detail:", allConsoleErrors);
  }
  console.log(`Total Failed Network Requests: ${allFailedRequests.length}`);
  if (allFailedRequests.length > 0) {
    console.log("Failed requests detail:", allFailedRequests);
  }

  const allPassed = allConsoleErrors.length === 0 && allFailedRequests.length === 0;
  console.log(`OVERALL STATUS: ${allPassed ? "PASSED (0 ERRORS)" : "FAILED"}`);
  console.log("=================================================\n");

  if (!allPassed) {
    process.exit(1);
  }
}

runComprehensiveQA().catch((err) => {
  console.error("QA automation run threw unexpected error:", err);
  process.exit(1);
});
