import { chromium } from "playwright-core";
import fs from "fs";
import {
  getTodayAD,
  getTodayBS,
  validateADDate,
  validateBSDate,
  getDaysInMonthAD,
  getDaysInMonthBS,
} from "./src/utils/calendar.js";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const TEST_URL = process.env.TEST_URL || "http://localhost:5173";

async function runCalendarValidationTests() {
  console.log("========================================================");
  console.log("🧪 TESTING AD & BS CALENDAR VALIDATION & DYNAMIC LIMITS");
  console.log("========================================================");

  // ---------------------------------------------------------------------------
  // 1. UNIT & LOGICAL VERIFICATION
  // ---------------------------------------------------------------------------
  console.log("\n--- 1. Testing Dynamic 'Today' Calculation ---");
  const todayAD = getTodayAD();
  const todayBS = getTodayBS();
  console.log(`Today AD: ${todayAD.formatted} (${todayAD.day}/${todayAD.month}/${todayAD.year})`);
  console.log(`Today BS: ${todayBS.formatted} (${todayBS.day}/${todayBS.month}/${todayBS.year} ${todayBS.monthName})`);

  // --- AD Tests: Yesterday, Today, Tomorrow ---
  console.log("\n--- 2. Testing AD (Yesterday, Today, Tomorrow) ---");
  // Today AD
  const vTodayAD = validateADDate(todayAD.formatted);
  console.log(`✓ AD Today (${todayAD.formatted}) Valid: ${vTodayAD.valid}`);
  if (!vTodayAD.valid) throw new Error(`AD Today rejected: ${vTodayAD.error}`);

  // Yesterday AD
  const dYesterdayAD = new Date(todayAD.jsDate.getTime() - 24 * 60 * 60 * 1000);
  const formattedYesterdayAD = `${String(dYesterdayAD.getDate()).padStart(2, "0")}/${String(dYesterdayAD.getMonth() + 1).padStart(2, "0")}/${dYesterdayAD.getFullYear()}`;
  const vYesterdayAD = validateADDate(formattedYesterdayAD);
  console.log(`✓ AD Yesterday (${formattedYesterdayAD}) Valid: ${vYesterdayAD.valid}`);
  if (!vYesterdayAD.valid) throw new Error(`AD Yesterday rejected: ${vYesterdayAD.error}`);

  // Tomorrow AD
  const dTomorrowAD = new Date(todayAD.jsDate.getTime() + 24 * 60 * 60 * 1000);
  const formattedTomorrowAD = `${String(dTomorrowAD.getDate()).padStart(2, "0")}/${String(dTomorrowAD.getMonth() + 1).padStart(2, "0")}/${dTomorrowAD.getFullYear()}`;
  const vTomorrowAD = validateADDate(formattedTomorrowAD);
  console.log(`✓ AD Tomorrow (${formattedTomorrowAD}) Valid: ${vTomorrowAD.valid}, Error: "${vTomorrowAD.error}"`);
  if (vTomorrowAD.valid) throw new Error("AD Tomorrow should be rejected as a future date!");
  if (vTomorrowAD.error !== "Date of birth cannot be later than today.") {
    throw new Error(`Unexpected error message for tomorrow AD: ${vTomorrowAD.error}`);
  }

  // --- BS Tests: Yesterday, Today, Tomorrow ---
  console.log("\n--- 3. Testing BS (Yesterday, Today, Tomorrow) ---");
  // Today BS
  const vTodayBS = validateBSDate(todayBS.formatted);
  console.log(`✓ BS Today (${todayBS.formatted}) Valid: ${vTodayBS.valid}`);
  if (!vTodayBS.valid) throw new Error(`BS Today rejected: ${vTodayBS.error}`);

  // Yesterday BS
  let yBsDay = todayBS.day - 1;
  let yBsMonth = todayBS.month;
  let yBsYear = todayBS.year;
  if (yBsDay < 1) {
    yBsMonth -= 1;
    if (yBsMonth < 1) {
      yBsYear -= 1;
      yBsMonth = 12;
    }
    yBsDay = getDaysInMonthBS(yBsYear, yBsMonth);
  }
  const formattedYesterdayBS = `${String(yBsDay).padStart(2, "0")}/${String(yBsMonth).padStart(2, "0")}/${yBsYear}`;
  const vYesterdayBS = validateBSDate(formattedYesterdayBS);
  console.log(`✓ BS Yesterday (${formattedYesterdayBS}) Valid: ${vYesterdayBS.valid}`);
  if (!vYesterdayBS.valid) throw new Error(`BS Yesterday rejected: ${vYesterdayBS.error}`);

  // Tomorrow BS
  let tBsDay = todayBS.day + 1;
  let tBsMonth = todayBS.month;
  let tBsYear = todayBS.year;
  const maxDaysThisMonthBS = getDaysInMonthBS(tBsYear, tBsMonth);
  if (tBsDay > maxDaysThisMonthBS) {
    tBsDay = 1;
    tBsMonth += 1;
    if (tBsMonth > 12) {
      tBsYear += 1;
      tBsMonth = 1;
    }
  }
  const formattedTomorrowBS = `${String(tBsDay).padStart(2, "0")}/${String(tBsMonth).padStart(2, "0")}/${tBsYear}`;
  const vTomorrowBS = validateBSDate(formattedTomorrowBS);
  console.log(`✓ BS Tomorrow (${formattedTomorrowBS}) Valid: ${vTomorrowBS.valid}, Error: "${vTomorrowBS.error}"`);
  if (vTomorrowBS.valid) throw new Error("BS Tomorrow should be rejected as a future date!");
  if (vTomorrowBS.error !== "Date of birth cannot be later than today.") {
    throw new Error(`Unexpected error message for tomorrow BS: ${vTomorrowBS.error}`);
  }

  // --- 4. Leap Years & Month Boundaries ---
  console.log("\n--- 4. Testing Leap Years & Month Boundaries ---");
  // AD Leap Years
  const leap2024 = validateADDate("29/02/2024");
  const nonLeap2025 = validateADDate("29/02/2025");
  const invalidApr31 = validateADDate("31/04/2026");
  console.log(`✓ AD Leap 29/02/2024 Valid: ${leap2024.valid}`);
  console.log(`✓ AD Non-Leap 29/02/2025 Valid: ${nonLeap2025.valid}`);
  console.log(`✓ AD 31/04/2026 Valid: ${invalidApr31.valid}`);
  if (!leap2024.valid) throw new Error("29/02/2024 is a leap year and must be valid");
  if (nonLeap2025.valid) throw new Error("29/02/2025 is not a leap year and must be invalid");
  if (invalidApr31.valid) throw new Error("31/04/2026 must be invalid (April has 30 days)");

  // BS Boundaries
  // In 2082 BS (past): Kartik has 30 days
  const bsKartik30_2082 = validateBSDate("30/07/2082");
  const bsKartik31_2082 = validateBSDate("31/07/2082");
  console.log(`✓ BS 30/07/2082 (Kartik 30) Valid: ${bsKartik30_2082.valid}`);
  console.log(`✓ BS 31/07/2082 (Kartik 31) Valid: ${bsKartik31_2082.valid}, Error: "${bsKartik31_2082.error}"`);
  if (!bsKartik30_2082.valid) throw new Error("30/07/2082 BS must be valid");
  if (bsKartik31_2082.valid) throw new Error("31/07/2082 BS must be invalid (Kartik 2082 only has 30 days)");

  // In 2083 BS: Asar (month 3) has 32 days
  const bsAsar32_2083 = validateBSDate("32/03/2083");
  const bsAsar33_2083 = validateBSDate("33/03/2083");
  console.log(`✓ BS 32/03/2083 (Asar 32) Valid: ${bsAsar32_2083.valid}`);
  console.log(`✓ BS 33/03/2083 (Asar 33) Valid: ${bsAsar33_2083.valid}`);
  if (!bsAsar32_2083.valid) throw new Error("32/03/2083 BS must be valid");
  if (bsAsar33_2083.valid) throw new Error("33/03/2083 BS must be invalid");

  // BS-to-AD Conversion Accuracy
  console.log("\n--- 5. Testing BS-to-AD Conversion Accuracy ---");
  console.log(`✓ Today BS (${todayBS.formatted}) converts to AD: ${vTodayBS.jsDate.toDateString()}`);
  console.log(`✓ Today AD date: ${todayAD.jsDate.toDateString()}`);
  if (vTodayBS.jsDate.toDateString() !== todayAD.jsDate.toDateString()) {
    throw new Error(`BS to AD conversion mismatch for today: ${vTodayBS.jsDate} vs ${todayAD.jsDate}`);
  }

  // ---------------------------------------------------------------------------
  // 2. BROWSER END-TO-END UI VERIFICATION
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Running Browser Automation UI Verification ---");
  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(TEST_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    // Verify Calendar tabs exist
    const adTab = await page.waitForSelector('button:has-text("AD (English)")');
    const bsTab = await page.waitForSelector('button:has-text("BS (Nepali)")');
    console.log("✓ Calendar switch tabs verified in UI: AD & BS");

    const dobInput = await page.waitForSelector("input#dob");
    const unlockBtn = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");

    // Test AD Tomorrow in UI
    console.log(`Testing AD Tomorrow entry: ${formattedTomorrowAD}`);
    await dobInput.fill(formattedTomorrowAD.replace(/\//g, ""));
    await unlockBtn.click();
    await page.waitForSelector('text=Date of birth cannot be later than today.', { timeout: 3000 });
    console.log("✓ UI correctly rejected AD Tomorrow with 'Date of birth cannot be later than today.'");

    // Test AD Today in UI -> Unlocks successfully!
    console.log(`Testing AD Today entry: ${todayAD.formatted}`);
    await dobInput.fill(todayAD.formatted.replace(/\//g, ""));
    await unlockBtn.click();
    await page.waitForSelector(".countdown-scene, .greeting-scene", { timeout: 5000 });
    console.log("✓ UI accepted AD Today and unlocked the birthday celebration!");

    // Reload to return to login screen
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector('button:has-text("BS (Nepali)")');

    // Switch to BS Calendar
    const bsTabReloaded = await page.waitForSelector('button:has-text("BS (Nepali)")');
    await bsTabReloaded.click();
    console.log("✓ Switched to Nepali BS calendar system");

    // Check placeholder and max label updated
    const bsPlaceholder = await page.$eval("input#dob", (el) => el.placeholder);
    console.log(`✓ BS Input placeholder: "${bsPlaceholder}"`);
    if (!bsPlaceholder.includes("BS")) throw new Error("Expected BS placeholder");

    const bsMaxLabel = await page.innerText('text=Max:');
    console.log(`✓ BS Dynamic Max Label: "${bsMaxLabel}"`);
    if (!bsMaxLabel.includes(todayBS.formatted)) {
      throw new Error(`Expected BS max label to include ${todayBS.formatted}, got ${bsMaxLabel}`);
    }

    const dobInputBS = await page.waitForSelector("input#dob");
    const unlockBtnBS = await page.waitForSelector("button:has-text('Unlock the Celebration ✨')");

    // Test BS Tomorrow in UI
    console.log(`Testing BS Tomorrow entry: ${formattedTomorrowBS}`);
    await dobInputBS.fill(formattedTomorrowBS.replace(/\//g, ""));
    await unlockBtnBS.click();
    await page.waitForSelector('text=Date of birth cannot be later than today.', { timeout: 3000 });
    console.log("✓ UI correctly rejected BS Tomorrow with 'Date of birth cannot be later than today.'");

    // Test BS Today in UI -> Unlocks successfully!
    console.log(`Testing BS Today entry: ${todayBS.formatted}`);
    await dobInputBS.fill(todayBS.formatted.replace(/\//g, ""));
    await unlockBtnBS.click();
    await page.waitForSelector(".countdown-scene, .greeting-scene", { timeout: 5000 });
    console.log("✓ UI accepted BS Today and unlocked the birthday celebration!");

    // Reload and test Calendar Picker Modal
    await page.reload({ waitUntil: "networkidle" });
    const pickerBtn = await page.waitForSelector('button[aria-label="Open Calendar Picker"]');
    await pickerBtn.click();
    await page.waitForSelector("text=Select Date of Birth", { timeout: 3000 });
    console.log("✓ Opened Calendar Picker Modal successfully");

    const confirmDateBtn = await page.waitForSelector('button:has-text("Confirm Date ✨")');
    await confirmDateBtn.click();
    console.log("✓ Confirmed date in Picker Modal");

    const inputVal = await page.$eval("input#dob", (el) => el.value);
    console.log(`✓ Input received date from picker: "${inputVal}"`);
    if (!inputVal) throw new Error("Input was not populated by picker");

    await context.close();
  } finally {
    await browser.close();
  }

  console.log("\n🎉 ALL AD & BS CALENDAR VALIDATION & DYNAMIC LIMIT TESTS PASSED WITH 100% SUCCESS!");
}

runCalendarValidationTests().catch((err) => {
  console.error("❌ Calendar test failed:", err);
  process.exit(1);
});
