import { chromium } from "playwright-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function testHeartVariations() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: #080611;
    font-family: 'Cinzel', serif;
    overflow: hidden;
  }

  /* Variation 1: Scaled with adjusted top/left and 45deg / -90deg */
  .v1-stage {
    position: relative;
    width: 400px;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .v1-wrapper {
    position: relative;
    animation: pulse 0.7s infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 260px;
    height: 260px;
  }
  .v1-heart {
    height: 180px;
    width: 120px;
    background-color: hotpink;
    border-radius: 120px 120px 0 0;
    transform: rotate(45deg);
    position: relative;
    animation: shadow 0.7s infinite;
  }
  .v1-heart::after {
    position: absolute;
    top: 30px;
    left: -30px;
    content: '';
    height: inherit;
    width: inherit;
    background-color: inherit;
    border-radius: inherit;
    transform: rotate(-90deg);
    animation: shadow 0.7s infinite;
  }

  /* Variation 2: Pure Symmetrical Classical Heart using .heart + ::before + ::after */
  .v2-stage {
    position: relative;
    width: 400px;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .v2-wrapper {
    position: relative;
    animation: pulse 0.7s infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 320px;
    height: 320px;
  }
  .v2-heart {
    position: relative;
    width: 220px;
    height: 220px;
    background-color: hotpink;
    transform: rotate(45deg);
    animation: shadow 0.7s infinite;
    margin-top: 50px;
  }
  .v2-heart::before {
    content: '';
    position: absolute;
    width: 220px;
    height: 220px;
    background-color: hotpink;
    border-radius: 50%;
    top: -110px;
    left: 0;
    animation: shadow 0.7s infinite;
  }
  .v2-heart::after {
    content: '';
    position: absolute;
    width: 220px;
    height: 220px;
    background-color: hotpink;
    border-radius: 50%;
    left: -110px;
    top: 0;
    animation: shadow 0.7s infinite;
  }

  /* Variation 3: Refined User Pseudo-element Geometry (50deg / -100deg with perfect symmetry origin) */
  .v3-stage {
    position: relative;
    width: 400px;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .v3-wrapper {
    position: relative;
    animation: pulse 0.7s infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 300px;
    height: 300px;
  }
  .v3-heart {
    height: 220px;
    width: 140px;
    background-color: hotpink;
    border-radius: 140px 140px 0 0;
    transform: rotate(45deg);
    transform-origin: 0% 100%;
    position: relative;
    animation: shadow 0.7s infinite;
    margin-left: -50px;
    margin-top: -30px;
  }
  .v3-heart::after {
    position: absolute;
    top: 0;
    left: 0;
    content: '';
    height: inherit;
    width: inherit;
    background-color: inherit;
    border-radius: inherit;
    transform: rotate(-90deg);
    transform-origin: 0% 100%;
    animation: shadow 0.7s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    70% { transform: scale(1.18); }
    100% { transform: scale(1); }
  }

  @keyframes shadow {
    0% {
      box-shadow: 0 0 0 0 hotpink, 0 0 0 0 #D4AF37;
    }
    50% {
      box-shadow: 0 0 20px 4px hotpink, 0 0 35px 8px #5B21B6;
    }
    70% {
      box-shadow: 0 0 45px 15px hotpink, 0 0 60px 20px #FFD700;
    }
    95% {
      box-shadow: 0 0 95px 5px hotpink, 0 0 90px 30px #5B21B6;
    }
    100% {
      box-shadow: 0 0 0 0 hotpink, 0 0 0 0 #D4AF37;
    }
  }

  .text-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 30;
    text-align: center;
    color: #FFF8F0;
    width: 240px;
    pointer-events: none;
    text-shadow: 0 0 10px #FFD700, 0 0 20px #FF69B4, 0 2px 4px #000;
  }
</style>
</head>
<body>
  <div class="v1-stage">
    <div style="color: gold; position: absolute; top: 10px;">Variation 1</div>
    <div class="v1-wrapper">
      <div class="v1-heart"></div>
      <div class="text-overlay">Happy Birthday, Dear Beastie! ❤️🎂</div>
    </div>
  </div>

  <div class="v2-stage">
    <div style="color: gold; position: absolute; top: 10px;">Variation 2</div>
    <div class="v2-wrapper">
      <div class="v2-heart"></div>
      <div class="text-overlay">Happy Birthday, Dear Beastie! ❤️🎂</div>
    </div>
  </div>

  <div class="v3-stage">
    <div style="color: gold; position: absolute; top: 10px;">Variation 3</div>
    <div class="v3-wrapper">
      <div class="v3-heart"></div>
      <div class="text-overlay">Happy Birthday, Dear Beastie! ❤️🎂</div>
    </div>
  </div>
</body>
</html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(600);
  await page.screenshot({ path: "test-variations.png" });
  await browser.close();
  console.log("Screenshot saved to test-variations.png");
}

testHeartVariations();
