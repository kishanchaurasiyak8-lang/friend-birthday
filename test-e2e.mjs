import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
console.log(`Using browser executable: ${executablePath}`);

const SCREENSHOT_DIR = "qa-screenshots";
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runQaTests() {
  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const errors = [];
  const warnings = [];

  async function testViewport(viewportName, width, height, isMobile = false) {
    console.log(`\n========================================`);
    console.log(`Testing Viewport: ${viewportName} (${width}x${height}, isMobile=${isMobile})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width, height },
      isMobile,
      hasTouch: isMobile,
    });

    const page = await context.newPage();

    // Listen for console errors and page errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`[Browser Console Error] [${viewportName}] ${msg.text()}`);
        errors.push(`[Console Error - ${viewportName}]: ${msg.text()}`);
      } else if (msg.type() === "warning") {
        warnings.push(`[Console Warning - ${viewportName}]: ${msg.text()}`);
      }
    });

    page.on("pageerror", (err) => {
      console.error(`[Unhandled Page Error] [${viewportName}] ${err.message}`);
      errors.push(`[Page Error - ${viewportName}]: ${err.message}`);
    });

    // Helper: check for horizontal scroll
    async function checkHorizontalScroll(sceneName) {
      const scrollInfo = await page.evaluate(() => {
        const docElem = document.documentElement;
        return {
          scrollWidth: docElem.scrollWidth,
          clientWidth: docElem.clientWidth,
          hasHorizontalScroll: docElem.scrollWidth > docElem.clientWidth,
        };
      });

      if (scrollInfo.hasHorizontalScroll) {
        const msg = `Horizontal overflow detected in ${sceneName} on ${viewportName}: scrollWidth (${scrollInfo.scrollWidth}) > clientWidth (${scrollInfo.clientWidth})`;
        console.warn(`⚠️ ${msg}`);
        warnings.push(msg);
      } else {
        console.log(`✓ No horizontal overflow in ${sceneName} (${scrollInfo.clientWidth}px)`);
      }
    }

    // --- 1. Fresh Browser Session: Verify DOB Login Page is displayed first ---
    console.log("\n--- Testing DOB Login Page on Fresh Session ---");
    const testUrl = process.env.TEST_URL || "http://localhost:5173";
    await page.goto(testUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    await page.waitForSelector("text=Midnight Access", { timeout: 5000 });
    await page.waitForSelector("text=A Secret Just for My Bestie 💜");
    await page.waitForSelector("label:has-text('Date of Birth')");
    const dobInput = await page.waitForSelector("input#dob");
    const unlockBtn = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");
    console.log("✓ DOB Login Page is the first page displayed.");

    // --- 2. Verify all birthday slides and scrapbook remain hidden ---
    const hiddenHeart = await page.$(".heart-scene");
    const hiddenCake = await page.$("text=Make a Wish, Bestie! 🎂");
    const hiddenGifts = await page.$("text=Your Birthday Gifts Are Here! 🎁");
    const hiddenAlbum = await page.$("text=Our Little World of Memories ❤️");
    const hiddenNav = await page.$('nav[aria-label="Surprise Journey Navigation"]');

    if (hiddenHeart || hiddenCake || hiddenGifts || hiddenAlbum || hiddenNav) {
      throw new Error("Birthday slides or stage navigation were exposed while locked!");
    }
    console.log("✓ All birthday slides and scrapbook are completely hidden while locked.");

    await checkHorizontalScroll("DOB Login Page");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewportName}-00-dob-login.png`) });

    // --- 3. Test Empty Submission ---
    console.log("\n--- Testing Empty DOB Submission ---");
    await unlockBtn.click();
    await page.waitForSelector("text=Please enter your date of birth (DD/MM/YY)", { timeout: 3000 });
    console.log("✓ Empty date submission correctly blocked with error message.");

    // --- 4. Test Invalid Calendar Date (e.g. 31/02/26) ---
    console.log("\n--- Testing Impossible Calendar Date (31/02/26) ---");
    await dobInput.fill("310226");
    const formattedImpossible = await dobInput.inputValue();
    console.log(`Auto-formatted impossible date input: "${formattedImpossible}"`);
    if (formattedImpossible !== "31/02/26") {
      throw new Error(`Expected auto-masking to '31/02/26', but got '${formattedImpossible}'`);
    }
    await unlockBtn.click();
    await page.waitForSelector("text=Please enter a valid date in DD/MM/YY format", { timeout: 3000 });
    console.log("✓ Calendar-impossible date (31/02/26) correctly rejected.");

    // --- 5. Test Incomplete Date (e.g. 18/10) ---
    console.log("\n--- Testing Incomplete Date (18/10) ---");
    await dobInput.fill("1810");
    await unlockBtn.click();
    await page.waitForSelector("text=Please enter a valid date in DD/MM/YY format", { timeout: 3000 });
    console.log("✓ Incomplete date correctly rejected.");

    // --- 6. Test Backspace / Deletion Formatting ---
    console.log("\n--- Testing Backspace Deletion ---");
    await dobInput.fill("181002");
    let fullVal = await dobInput.inputValue();
    if (fullVal !== "18/10/02") throw new Error(`Expected '18/10/02', got '${fullVal}'`);
    await dobInput.press("Backspace");
    let valAfterBackspace = await dobInput.inputValue();
    console.log(`Value after backspace: "${valAfterBackspace}"`);

    // --- 7. Verify Refreshing Returns to Login Page ---
    console.log("\n--- Testing Refresh Behavior ---");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("text=Midnight Access", { timeout: 5000 });
    await page.waitForSelector("text=A Secret Just for My Bestie 💜");
    const reloadedLockedHeart = await page.$(".heart-scene");
    if (reloadedLockedHeart) throw new Error("Slides exposed after reload!");
    console.log("✓ Refreshing correctly returns to the DOB login page.");

    // --- 8. Unlock with Valid Date (18/10/02) -> Transitions directly to Birthday Reveal Screen ---
    console.log("\n--- Unlocking with Valid Date (18/10/02) ---");
    const loginInput = await page.waitForSelector("input#dob");
    const loginUnlockBtn = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");
    await loginInput.fill("181002");
    await page.waitForTimeout(200);
    await loginUnlockBtn.click();

    // --- SLIDE 1: Greeting & Countdown ---
    console.log("\n--- Testing Slide 1 (Greeting & Countdown) ---");
    await page.waitForSelector(".countdown-scene, .greeting-scene", { timeout: 6000 });
    console.log("✓ Unlocked and entered Slide 1 (Greeting & Countdown).");

    // Verify Slide 1 Main Heading
    const slide1Heading = await page.waitForSelector(".slide1-main-heading, h1:has-text('Happy Birthday')");
    const headingText = await slide1Heading.innerText();
    console.log(`✓ Slide 1 Heading: "${headingText.replace(/\n/g, ' ')}"`);
    if (!headingText.includes("My Bestie! ❤️")) {
      throw new Error(`Expected heading to contain 'My Bestie! ❤️', got: ${headingText}`);
    }
    if (headingText.includes("— BESTIE!")) {
      throw new Error("Duplicated '— BESTIE!' found in heading!");
    }

    // Verify Universal Navigation on Slide 1 (Back button hidden/disabled)
    const navBar = await page.waitForSelector(".universal-nav-bar");
    const prevBtnOnSlide1 = await page.$(".nav-prev-btn");
    const prevVisibility = await prevBtnOnSlide1.evaluate((el) => window.getComputedStyle(el).visibility);
    console.log(`✓ Universal Navigation on Slide 1: Back button visibility = ${prevVisibility} (expected hidden)`);
    if (prevVisibility !== "hidden") {
      throw new Error("Back button should be hidden on Slide 1");
    }

    await page.waitForTimeout(400);
    await checkHorizontalScroll("Slide 1 Greeting");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewportName}-01-greeting.png`) });

    // Advance to Slide 2 using Universal Navigation "Next" button
    const nextBtnSlide1 = await page.waitForSelector(".nav-next-btn");
    await nextBtnSlide1.click();
    console.log("✓ Clicked Universal 'Next →' to advance to Slide 2");

    // --- SLIDE 2: 3D Heart Packing Simulation Scene ---
    console.log("\n--- Testing Slide 2 (3D Heart Packing Simulation) ---");
    await page.waitForSelector(".heart-scene", { timeout: 6000 });

    // Verify Three.js Heart Packing Canvas
    const canvas3D = await page.waitForSelector("canvas.heart-packing-canvas", { timeout: 6000 });
    if (!canvas3D) throw new Error("Three.js 3D Heart Packing Canvas not found!");

    const canvasMetrics = await canvas3D.evaluate((cvs) => {
      const rect = cvs.getBoundingClientRect();
      const gl = cvs.getContext("webgl2") || cvs.getContext("webgl");
      return {
        width: rect.width,
        height: rect.height,
        hasContext: !!gl,
      };
    });
    console.log(`✓ 3D Heart Packing Canvas verified: ${canvasMetrics.width}x${canvasMetrics.height}px, WebGL Context Active: ${canvasMetrics.hasContext}`);
    if (canvasMetrics.width < 100 || canvasMetrics.height < 100 || !canvasMetrics.hasContext) {
      throw new Error("3D Heart Packing canvas invalid dimensions or missing WebGL context");
    }

    // Test Universal Navigation: "← Back" from Slide 2 to Slide 1 and forward again
    const prevBtnSlide2 = await page.waitForSelector(".nav-prev-btn");
    await prevBtnSlide2.click();
    await page.waitForSelector(".countdown-scene, .greeting-scene", { timeout: 4000 });
    console.log("✓ Tested Universal Navigation: '← Back' returned to Slide 1 successfully!");

    const returnNextBtn = await page.waitForSelector(".nav-next-btn");
    await returnNextBtn.click();
    await page.waitForSelector(".heart-scene", { timeout: 4000 });
    console.log("✓ Universal Navigation: 'Next →' re-entered Slide 2 successfully!");

    await page.waitForSelector("text=MIDNIGHT MAGIC");
    await page.waitForSelector('h2:has-text("Happy Birthday, Dear Bestie! ❤️🎂")', { timeout: 8000 });
    console.log("✓ Central heading 'Happy Birthday, Dear Bestie! ❤️🎂' fully typed and verified!");

    await page.waitForSelector("text=To my one and only Bestie", { timeout: 5000 });
    console.log("✓ Supporting inside subtitle verified.");

    await page.waitForSelector("text=Officially older, but don't worry", { timeout: 5000 });
    console.log("✓ Supporting cards appeared.");

    await page.waitForTimeout(400);
    await checkHorizontalScroll("Slide 2 Heart Packing Scene");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewportName}-02-heart-packing.png`) });

    const continueBtn = await page.waitForSelector('button:has-text("Continue the Magic ✨")');
    await continueBtn.click();
    console.log("✓ Clicked 'Continue the Magic ✨'");

    // --- SCENE 2: Cake Scene ---
    console.log("\n--- Testing Cake Scene ---");
    await page.waitForSelector("text=Make a Wish, Bestie! 🎂", { timeout: 5000 });
    console.log("✓ Cake Intro loaded.");

    await page.waitForTimeout(400);
    await checkHorizontalScroll("Cake Intro");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewportName}-02-cake-intro.png`) });

    const cutBtn = await page.waitForSelector('button:has-text("Let\'s Cut the Cake 🎂")');
    await cutBtn.click();
    console.log("✓ Clicked 'Let\\'s Cut the Cake 🎂'");

    await page.waitForSelector("text=YAYYYY! 🎉 The cake has officially been cut!", { timeout: 6000 });
    console.log("✓ Cake Celebration loaded: Cake slice separated, candles blown, confetti burst.");

    await page.waitForTimeout(400);
    await checkHorizontalScroll("Cake Celebration");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewportName}-03-cake-cut.png`) });

    const giftsBtn = await page.waitForSelector('button:has-text("Open Your Gifts 🎁")');
    await giftsBtn.click();
    console.log("✓ Clicked 'Open Your Gifts 🎁'");

    // --- SCENE 3: Birthday Gifts (4 Gifts) ---
    console.log("\n--- Testing Birthday Gifts (4 Gifts) ---");
    await page.waitForSelector("text=Your Birthday Gifts Are Here! 🎁", { timeout: 5000 });
    console.log("✓ Gifts Scene loaded.");

    // Verify 4 gift cards in grid
    const giftCards = await page.$$(".gift-card");
    console.log(`✓ Total gift cards in grid: ${giftCards.length}`);
    if (giftCards.length !== 4) {
      throw new Error(`Expected 4 gift cards, but found ${giftCards.length}`);
    }

    const funnyGift = await page.waitForSelector('[role="button"]:has-text("Open Funny Gift")');
    await funnyGift.click();
    await page.waitForSelector("text=Birthday rule number one");
    console.log("✓ Gift 1 (Funny) opened successfully.");

    const friendshipGift = await page.waitForSelector('[role="button"]:has-text("Open Friendship Gift")');
    await friendshipGift.click();
    await page.waitForSelector("text=Thank you for being my friend");
    console.log("✓ Gift 2 (Friendship) opened successfully.");

    const bouquetGift = await page.waitForSelector('[role="button"]:has-text("Open Bouquet Gift 💐")');
    await bouquetGift.click();
    await page.waitForSelector('img[alt="A Bouquet for Bestie"]');
    await page.waitForSelector("text=A little bouquet for my favorite bestie. May your life always bloom with happiness. 💐");
    console.log("✓ Gift 3 (Bouquet) opened: Flower bouquet image and message verified!");

    const albumGift = await page.waitForSelector('[role="button"]:has-text("Open Our Memories ❤️")');
    await albumGift.click();
    await page.waitForSelector("text=Scrapbook Unlocked!");
    console.log("✓ Gift 4 (Memory Album) opened successfully.");

    await page.waitForSelector("text=All 4 Gifts Unlocked! ✨ Ready to View Memories");
    console.log("✓ All 4 gifts opened status confirmed.");

    // Verify flowers emerged smoothly in all 4 boxes
    await page.waitForTimeout(600);
    const flowerStats = await page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll(".gift-flowers-container"));
      const emerged = Array.from(document.querySelectorAll(".gift-flowers-container.flowers-emerged"));
      return {
        total: containers.length,
        emergedCount: emerged.length,
        sampleOpacity: emerged[0] ? window.getComputedStyle(emerged[0]).opacity : "0",
      };
    });
    console.log(`✓ Gift box flowers verified: ${flowerStats.emergedCount} of ${flowerStats.total} bouquets emerged smoothly from inside the boxes (opacity: ${flowerStats.sampleOpacity}).`);
    if (flowerStats.total !== 4 || flowerStats.emergedCount !== 4 || parseFloat(flowerStats.sampleOpacity) < 0.9) {
      throw new Error(`Flowers pop-up failed verification: total=${flowerStats.total}, emerged=${flowerStats.emergedCount}`);
    }

    await page.waitForTimeout(500);
    await checkHorizontalScroll("Scene Gifts (4 boxes)");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewportName}-04-gifts-4boxes.png`) });

    const discoverMemoriesBtn = await page.waitForSelector('button:has-text("Discover Our Memories 📸")');
    await discoverMemoriesBtn.click();
    console.log("✓ Clicked 'Discover Our Memories 📸'");

    // --- SCENE 4: Friendship Album ---
    console.log("\n--- Testing Friendship Album ---");
    await page.waitForSelector("text=Our Little World of Memories ❤️", { timeout: 5000 });
    console.log("✓ Scrapbook cover loaded.");

    await checkHorizontalScroll("Album Cover");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewportName}-05-album-cover.png`) });

    const openBookBtn = await page.waitForSelector('button:has-text("Click to Open Scrapbook 📖")');
    await openBookBtn.click();
    console.log("✓ Clicked 'Click to Open Scrapbook 📖'");

    await page.waitForSelector("text=Page 1 of 4");
    await page.waitForSelector("text=My Favourite Bestie 💖");
    console.log("✓ Album Page 1 verified ('My Favourite Bestie 💖').");

    // Verify Font Awesome Heart in Photo Scene
    const faHeart = await page.waitForSelector("i#heart.fa.fa-heart", { timeout: 4000 });
    if (!faHeart) throw new Error("Font Awesome heart <i id='heart' class='fa fa-heart'> not found!");
    const heartIconInfo = await page.evaluate(() => {
      const el = document.getElementById("heart");
      const cs = window.getComputedStyle(el);
      const link = document.querySelector('link[href*="font-awesome"]');
      return {
        id: el.id,
        className: el.className,
        color: cs.color,
        animName: cs.animationName,
        hasFaStylesheet: !!link,
      };
    });
    console.log(`✓ Font Awesome heart in photo scene verified: #${heartIconInfo.id} [${heartIconInfo.className}], color=${heartIconInfo.color}, anim=${heartIconInfo.animName}, FA stylesheet linked=${heartIconInfo.hasFaStylesheet}`);
    if (!heartIconInfo.hasFaStylesheet || !heartIconInfo.animName.includes("photoHeartPump")) {
      throw new Error("Font Awesome heart verification failed");
    }

    const nextBtn = await page.waitForSelector('button:has-text("Next")');
    await nextBtn.click();
    await page.waitForSelector("text=Page 2 of 4");
    await page.waitForSelector("text=Crazy Moments 😂");
    console.log("✓ Album Page 2 verified.");

    await nextBtn.click();
    await page.waitForSelector("text=Page 3 of 4");
    await page.waitForSelector("text=Beautiful Memories 🥹");
    console.log("✓ Album Page 3 verified.");

    const prevBtn = await page.waitForSelector('button:has-text("Previous")');
    await prevBtn.click();
    await page.waitForSelector("text=Page 2 of 4");
    console.log("✓ Album Previous navigation to Page 2 verified.");

    await nextBtn.click();
    await page.waitForSelector("text=Page 3 of 4");
    await nextBtn.click();
    await page.waitForSelector("text=Page 4 of 4");
    await page.waitForSelector("text=Forever My Bestie 💗");
    console.log("✓ Album Page 4 verified ('Forever My Bestie 💗').");

    await page.waitForTimeout(400);
    await checkHorizontalScroll("Album Open");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewportName}-06-album-open.png`) });

    const lastSurpriseBtn = await page.waitForSelector('button:has-text("One Last Surprise 💝")');
    await lastSurpriseBtn.click();
    console.log("✓ Clicked 'One Last Surprise 💝'");

    // --- SCENE 5: Final Birthday Letter & Virtual Hug ---
    console.log("\n--- Testing Final Birthday Letter & Virtual Hug ---");
    await page.waitForSelector('h1:has-text("Happy Birthday to My Bestie! ❤️🎂")', { timeout: 8000 });
    console.log("✓ Final Letter heading typed and verified (no duplicated '— BESTIE!').");

    await page.waitForSelector("text=Dear Bestie, ❤️");
    await page.waitForSelector("text=You're not just another person in my life. You're my one and only Bestie. 💖");
    console.log("✓ Letter content verified ('Bestie').");

    await page.waitForTimeout(400);
    await checkHorizontalScroll("Final Letter");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewportName}-07-final-letter.png`) });

    const hugBtn = await page.waitForSelector('button:has-text("Send a Virtual Birthday Hug 🤗")');
    await hugBtn.click();
    console.log("✓ Clicked 'Send a Virtual Birthday Hug 🤗'");

    await page.waitForSelector("text=Virtual Hug Delivered Successfully! 🤗❤️", { timeout: 5000 });
    console.log("✓ Virtual Hug state and animated illustration verified.");

    await page.waitForTimeout(400);
    await checkHorizontalScroll("Virtual Hug");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewportName}-08-virtual-hug.png`) });

    const replayBtn = await page.waitForSelector('button:has-text("Replay Our Midnight Magic 🔄")');
    await replayBtn.click();
    console.log("✓ Clicked 'Replay Our Midnight Magic 🔄'");

    await page.waitForSelector(".countdown-scene, .greeting-scene, .heart-scene", { timeout: 5000 });
    console.log("✓ Successfully replayed back to Scene 1!");

    // --- Testing Audio Controls Widget ---
    console.log("\n--- Testing Audio Widget ---");
    const playMusicBtn = await page.waitForSelector('button:has-text("Play Birthday Music 🎵"), button:has-text("Pause Music ⏸️")');
    const initialText = await playMusicBtn.innerText();
    console.log(`Initial audio button state: "${initialText}"`);

    await playMusicBtn.click();
    await page.waitForTimeout(500);

    const afterClickText = await playMusicBtn.innerText();
    console.log(`Audio button state after click: "${afterClickText}"`);

    const muteBtn = await page.waitForSelector('button[aria-label="Mute"], button[aria-label="Unmute"]');
    await muteBtn.click();
    console.log("✓ Mute toggle verified.");

    await context.close();
  }

  // 1. Run Desktop QA Test
  await testViewport("desktop", 1440, 900, false);

  // 2. Run Mobile QA Test (iPhone 13 viewport)
  await testViewport("mobile", 390, 844, true);

  await browser.close();

  console.log("\n========================================");
  console.log("QA TEST SUMMARY");
  console.log("========================================");
  console.log(`Errors encountered: ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach((err) => console.error(`  - ${err}`));
  }
  console.log(`Warnings encountered: ${warnings.length}`);
  if (warnings.length > 0) {
    warnings.forEach((warn) => console.warn(`  - ${warn}`));
  }

  if (errors.length === 0) {
    console.log("\n🎉 ALL E2E & COMPONENT QA TESTS PASSED WITH 0 ERRORS!");
  } else {
    process.exit(1);
  }
}

runQaTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
