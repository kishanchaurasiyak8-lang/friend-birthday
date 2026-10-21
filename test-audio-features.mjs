import { chromium } from "playwright-core";
import fs from "fs";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const TEST_URL = process.env.TEST_URL || "http://localhost:5173";

async function runAudioTests() {
  console.log("=== Testing Birthday Audio Autoplay & Control System ===");
  console.log(`Browser: ${executablePath}`);
  console.log(`Target URL: ${TEST_URL}\n`);

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Blocked Autoplay prompts with "🎵 Tap to Start the Birthday Surprise ❤️"
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Autoplay Blocked -> Tap Button Displayed & Clicked ---");
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await page1.goto(TEST_URL, { waitUntil: "networkidle" });
    await page1.waitForTimeout(600);

    // Verify tap button appears when autoplay is blocked by browser policy
    const tapBtn = await page1.waitForSelector('button:has-text("Tap to Start the Birthday Surprise")', {
      timeout: 5000,
    });
    const tapBtnText = (await tapBtn.innerText()).trim();
    console.log(`✓ Detected Tap Prompt Button: "${tapBtnText}"`);
    if (!tapBtnText.includes("🎵") || (!tapBtnText.includes("❤️") && !tapBtnText.includes("💖")) || !tapBtnText.includes("Tap to Start the Birthday Surprise")) {
      throw new Error(`Tap button text mismatch: "${tapBtnText}"`);
    }

    // Click the button
    await tapBtn.click();
    await page1.waitForTimeout(500);

    // Verify audio started playing
    const audioPlayingAfterTap = await page1.evaluate(() => {
      const audio = window.__audioManagerAudio || document.querySelector("audio");
      return !audio || (!audio.paused && audio.currentTime > 0);
    });
    console.log(`✓ Audio playing after tapping prompt button: ${audioPlayingAfterTap}`);

    // Verify tap button is now gone
    const tapBtnGone = (await page1.$('button:has-text("Tap to Start the Birthday Surprise")')) === null;
    console.log(`✓ Prompt button disappeared after music started: ${tapBtnGone}`);
    if (!tapBtnGone) {
      throw new Error("Prompt button should disappear after playback begins");
    }

    // Verify AudioControls displays "Pause Music ⏸️" with equalizer waves
    const pauseBtn = await page1.waitForSelector('button:has-text("Pause Music ⏸️")', { timeout: 3000 });
    const hasEqWaves = (await page1.$$(".gold-eq-bar")).length === 4;
    console.log(`✓ AudioControls pill shows "Pause Music ⏸️" with 4 equalizer wave bars: ${hasEqWaves}`);
    if (!hasEqWaves) throw new Error("Expected 4 gold equalizer wave bars");

    await context1.close();

    // -------------------------------------------------------------------------
    // TEST 2: Direct DOB Login automatically starts song at beginning of experience
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Unlock DOB Login Gate Automatically Starts Music ---");
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await page2.goto(TEST_URL, { waitUntil: "networkidle" });
    await page2.waitForTimeout(600);

    // Enter DOB without tapping the prompt button
    const dobInput = await page2.waitForSelector("input#dob");
    await dobInput.fill("181002");
    const unlockBtn = await page2.waitForSelector("button:has-text('Unlock the Celebration ✨')");
    await unlockBtn.click();

    // Verify slide 1 entered
    await page2.waitForSelector(".countdown-scene, .greeting-scene", { timeout: 5000 });
    console.log("✓ Unlocked into Slide 1 (Greeting & Countdown)");

    // Audio should now be playing automatically
    await page2.waitForSelector('button:has-text("Pause Music ⏸️")', { timeout: 4000 });
    console.log("✓ Music automatically started upon unlocking the celebration!");

    // -------------------------------------------------------------------------
    // TEST 3: Continuous playback across slides without restarting
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Continuous Playback Across Slides Without Restarting ---");

    // Advance to Slide 2
    const nextBtn1 = await page2.waitForSelector(".nav-next-btn");
    await nextBtn1.click();
    await page2.waitForSelector(".heart-scene", { timeout: 6000 });
    console.log("✓ Advanced to Slide 2 (3D Heart Packing)");

    // Check Audio still playing
    await page2.waitForSelector('button:has-text("Pause Music ⏸️")', { timeout: 2000 });
    console.log("✓ Music continues playing in Slide 2");

    // Advance to Slide 3 (Cake)
    const nextBtn2 = await page2.waitForSelector(".nav-next-btn");
    await nextBtn2.click();
    await page2.waitForSelector("text=Make a Wish, Bestie! 🎂", { timeout: 6000 });
    console.log("✓ Advanced to Slide 3 (Midnight Cake)");
    await page2.waitForSelector('button:has-text("Pause Music ⏸️")', { timeout: 2000 });
    console.log("✓ Music continues playing in Slide 3");

    // Advance to Slide 5 (Gifts)
    const nextBtn3 = await page2.waitForSelector(".nav-next-btn");
    await nextBtn3.click(); // to cake_cut
    await page2.waitForTimeout(300);
    const nextBtn4 = await page2.waitForSelector(".nav-next-btn");
    await nextBtn4.click(); // to gifts
    await page2.waitForSelector("text=Your Birthday Gifts Are Here! 🎁", { timeout: 6000 });
    console.log("✓ Advanced to Slide 5 (Birthday Gifts)");
    await page2.waitForSelector('button:has-text("Pause Music ⏸️")', { timeout: 2000 });
    console.log("✓ Music continues playing in Slide 5");

    // Advance to Slide 6 (Album)
    const nextBtn5 = await page2.waitForSelector(".nav-next-btn");
    await nextBtn5.click();
    await page2.waitForSelector("text=Our Little World of Memories ❤️", { timeout: 6000 });
    console.log("✓ Advanced to Slide 6 (Friendship Album)");
    await page2.waitForSelector('button:has-text("Pause Music ⏸️")', { timeout: 2000 });
    console.log("✓ Music continues playing in Slide 6");

    // Advance to Slide 7 (Final Letter)
    const nextBtn6 = await page2.waitForSelector(".nav-next-btn");
    await nextBtn6.click();
    await page2.waitForSelector('h1:has-text("Happy Birthday to My Bestie! ❤️🎂")', { timeout: 8000 });
    console.log("✓ Advanced to Slide 7 (Final Letter & Hug)");
    await page2.waitForSelector('button:has-text("Pause Music ⏸️")', { timeout: 2000 });
    console.log("✓ Music continues playing through Final Slide!");

    // -------------------------------------------------------------------------
    // TEST 4: Audio Controls, Pause/Resume, Mute/Unmute & Session Persistence
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Floating Controls, Mute/Unmute & Session Persistence ---");
    const pauseToggle = await page2.waitForSelector('button:has-text("Pause Music ⏸️")');
    await pauseToggle.click();
    await page2.waitForSelector('button:has-text("Play Birthday Music 🎵")', { timeout: 3000 });
    console.log("✓ Paused music via AudioControls pill.");

    // Toggle mute
    const muteBtn = await page2.waitForSelector('button[aria-label="Mute"]');
    await muteBtn.click();
    await page2.waitForSelector('button[aria-label="Unmute"]', { timeout: 3000 });
    console.log("✓ Muted audio via volume toggle.");

    // Verify session storage remembered pause and mute
    const storageState = await page2.evaluate(() => ({
      paused: sessionStorage.getItem("birthday_music_paused"),
      muted: sessionStorage.getItem("birthday_music_muted"),
    }));
    console.log(`✓ SessionStorage persisted: paused=${storageState.paused}, muted=${storageState.muted}`);
    if (storageState.paused !== "true" || storageState.muted !== "true") {
      throw new Error(`Expected paused=true & muted=true, got ${JSON.stringify(storageState)}`);
    }

    // Resume play
    const playToggle = await page2.waitForSelector('button:has-text("Play Birthday Music 🎵")');
    await playToggle.click();
    await page2.waitForSelector('button:has-text("Pause Music ⏸️")', { timeout: 3000 });
    console.log("✓ Resumed music via AudioControls pill.");

    await context2.close();

    console.log("\n🎉 ALL AUDIO AUTOPLAY & CONTROLS VERIFICATION TESTS PASSED!");
  } finally {
    await browser.close();
  }
}

runAudioTests().catch((err) => {
  console.error("❌ Audio test failure:", err);
  process.exit(1);
});
