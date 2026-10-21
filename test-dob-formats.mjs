import { chromium } from "playwright-core";
import fs from "fs";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

async function runDobValidationTest() {
  console.log("=================================================");
  console.log("TESTING 2-DIGIT & 4-DIGIT YEAR DOB VALIDATION");
  console.log("=================================================");

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error(`[Console Error]: ${msg.text()}`);
    }
  });

  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });

  const dobInput = await page.waitForSelector("input#dob");
  const unlockBtn = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");

  // 1. Verify maxLength allows 10 characters (DD/MM/YYYY)
  const maxLength = await dobInput.getAttribute("maxLength");
  console.log(`✓ Input maxLength attribute: ${maxLength} (expected 10)`);
  if (parseInt(maxLength, 10) < 10) {
    throw new Error(`maxLength should be at least 10, got ${maxLength}`);
  }

  // 2. Test typing 10 characters (4-digit year): 18/10/2002
  await dobInput.fill("18102002");
  let val4Digit = await dobInput.inputValue();
  console.log(`✓ 4-digit year input value: "${val4Digit}" (length: ${val4Digit.length})`);
  if (val4Digit !== "18/10/2002") {
    throw new Error(`Expected '18/10/2002', got '${val4Digit}'`);
  }

  // 3. Test unlock with 4-digit year (18/10/2002)
  await unlockBtn.click();
  await page.waitForSelector(".countdown-scene, .greeting-scene, .heart-scene", { timeout: 4000 });
  console.log("✓ Successfully unlocked with 4-digit year (18/10/2002)!");

  // 4. Test unlock with 2-digit year (18/10/02) on a fresh reload
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  const dobInput2 = await page.waitForSelector("input#dob");
  const unlockBtn2 = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");

  await dobInput2.fill("181002");
  let val2Digit = await dobInput2.inputValue();
  console.log(`✓ 2-digit year input value: "${val2Digit}" (length: ${val2Digit.length})`);
  if (val2Digit !== "18/10/02") {
    throw new Error(`Expected '18/10/02', got '${val2Digit}'`);
  }

  await unlockBtn2.click();
  await page.waitForSelector(".countdown-scene, .greeting-scene, .heart-scene", { timeout: 4000 });
  console.log("✓ Successfully unlocked with 2-digit year (18/10/02)!");

  // 5. Test 2-digit 90s year (e.g. 15/08/98 -> 1998)
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  const dobInput3 = await page.waitForSelector("input#dob");
  const unlockBtn3 = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");

  await dobInput3.fill("150898");
  await unlockBtn3.click();
  await page.waitForSelector(".countdown-scene, .greeting-scene, .heart-scene", { timeout: 4000 });
  console.log("✓ Successfully unlocked with 2-digit 90s year (15/08/98)!");

  // 6. Test incomplete year rejection (e.g. 18/10/2 or 18/10/20)
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  const dobInput4 = await page.waitForSelector("input#dob");
  const unlockBtn4 = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");

  await dobInput4.fill("18102");
  await unlockBtn4.click();
  let onLogin = await page.evaluate(() => !!document.querySelector("input#dob"));
  let errorMsg = await page.evaluate(() => document.querySelector(".scene-fade-in[style*='color: rgb(255, 182, 193)'], .scene-fade-in[style*='color: #FFB6C1']")?.textContent || "");
  console.log(`✓ Incomplete year (18/10/2) rejected: onLogin=${onLogin}, error="${errorMsg}"`);
  if (!onLogin || !errorMsg) {
    throw new Error("Incomplete date was not properly rejected");
  }

  // 7. Test 4-digit impossible date rejection (e.g. 31/02/2026)
  await dobInput4.fill("");
  await dobInput4.fill("31022026");
  await unlockBtn4.click();
  onLogin = await page.evaluate(() => !!document.querySelector("input#dob"));
  errorMsg = await page.evaluate(() => document.querySelector(".scene-fade-in[style*='color: rgb(255, 182, 193)'], .scene-fade-in[style*='color: #FFB6C1']")?.textContent || "");
  console.log(`✓ 4-digit impossible date (31/02/2026) rejected: onLogin=${onLogin}, error="${errorMsg}"`);
  if (!onLogin || !errorMsg) {
    throw new Error("4-digit impossible calendar date was not properly rejected");
  }

  // 8. Test 2-digit impossible date rejection (e.g. 31/02/26)
  await dobInput4.fill("");
  await dobInput4.fill("310226");
  await unlockBtn4.click();
  onLogin = await page.evaluate(() => !!document.querySelector("input#dob"));
  errorMsg = await page.evaluate(() => document.querySelector(".scene-fade-in[style*='color: rgb(255, 182, 193)'], .scene-fade-in[style*='color: #FFB6C1']")?.textContent || "");
  console.log(`✓ 2-digit impossible date (31/02/26) rejected: onLogin=${onLogin}, error="${errorMsg}"`);
  if (!onLogin || !errorMsg) {
    throw new Error("2-digit impossible calendar date was not properly rejected");
  }

  await browser.close();
  console.log("\n=================================================");
  console.log("ALL DOB 2-DIGIT & 4-DIGIT TESTS PASSED SUCCESSFULLY! 🎉");
  console.log("=================================================");
}

runDobValidationTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
