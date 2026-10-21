import { chromium } from "playwright-core";
import fs from "fs";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const LIVE_URL = "https://1daffd730a39d4.lhr.life";

async function testLiveLink() {
  console.log(`Connecting to Live Public URL: ${LIVE_URL}`);
  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto(LIVE_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // 1. Verify Login Screen elements loaded
    await page.waitForSelector("text=A Secret Just for My Bestie 💜", { timeout: 5000 });
    console.log("✓ Live website loaded successfully over the public internet!");

    // 2. Check Tap Prompt Button
    const tapBtn = await page.waitForSelector('button:has-text("Tap to Start the Birthday Surprise")', { timeout: 4000 });
    console.log("✓ '🎵 Tap to Start the Birthday Surprise ❤️' button is visible to user.");

    // 3. Click the prompt button (simulating user's entrance touch)
    await tapBtn.click();
    await page.waitForTimeout(600);

    // 4. Verify audio playback started
    const audioState = await page.evaluate(() => {
      const audio = document.querySelector("audio");
      return {
        exists: !!audio,
        paused: audio ? audio.paused : null,
        currentTime: audio ? audio.currentTime : 0,
        muted: audio ? audio.muted : null,
      };
    });
    console.log("✓ Audio playback verified:", audioState);
    if (!audioState.exists || audioState.paused) {
      throw new Error("Audio is not playing!");
    }

    // 5. Test unlock with valid date
    const dobInput = await page.waitForSelector("input#dob");
    await dobInput.fill("181002");
    const unlockBtn = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");
    await unlockBtn.click();

    // 6. Verify Slide 1 entered and music still playing
    await page.waitForSelector(".countdown-scene, .greeting-scene", { timeout: 5000 });
    console.log("✓ Unlocked celebration on live URL!");

    const isStillPlaying = await page.evaluate(() => {
      const audio = document.querySelector("audio");
      return audio && !audio.paused && audio.currentTime > 0;
    });
    console.log(`✓ Music continues playing in Slide 1: ${isStillPlaying}`);
    if (!isStillPlaying) {
      throw new Error("Music stopped after entering!");
    }

    console.log("\n🎉 LIVE PUBLIC LINK IS FULLY FUNCTIONAL WITH AUTOMATIC AUDIO PLAYBACK!");
  } finally {
    await browser.close();
  }
}

testLiveLink().catch((err) => {
  console.error("❌ Live link test failed:", err);
  process.exit(1);
});
