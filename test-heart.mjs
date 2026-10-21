import { chromium } from "playwright-core";
import fs from "fs";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function testHeart() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

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
    justify-content: center;
    background: #080611;
    font-family: 'Cinzel', serif;
    overflow: hidden;
  }

  /* Scaled version preserving exact ratios:
     original: w=50px, h=70px, top=17px, left=-14px, rot=50deg, after-rot=-100deg
     multiplier: 4.2
     w = 210px
     h = 294px
     border-radius: 210px 210px 0 0
     top = 71.4px
     left = -58.8px
  */

  .heart-stage {
    position: relative;
    width: 500px;
    height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .wrapper {
    position: relative;
    animation: pulse 0.7s infinite;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .heart {
    height: 294px;
    width: 210px;
    margin: auto;
    background-color: hotpink;
    border-radius: 210px 210px 0 0;
    transform: rotate(50deg);
    position: relative;
    animation: shadow 0.7s infinite;
  }

  .heart::after {
    position: absolute;
    top: 71.4px;
    left: -58.8px;
    content: '';
    height: inherit;
    width: inherit;
    background-color: inherit;
    border-radius: inherit;
    transform: rotate(-100deg);
    animation: shadow 0.7s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    70% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  @keyframes shadow {
    0% {
      box-shadow: 0 0 0 0 hotpink, 0 0 0 0 #D4AF37;
    }
    50% {
      box-shadow: 0 0 15px 2px hotpink, 0 0 25px 4px #5B21B6;
    }
    70% {
      box-shadow: 0 0 35px 12px hotpink, 0 0 45px 15px #FFD700;
    }
    95% {
      box-shadow: 0 0 90px 4px hotpink, 0 0 70px 20px #5B21B6;
    }
  }

  .heart-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 25;
    text-align: center;
    color: #FFF8F0;
    width: 320px;
    text-shadow: 0 0 15px #FFD700, 0 0 25px #FF69B4, 0 2px 5px rgba(0,0,0,0.9);
    pointer-events: none;
  }
</style>
</head>
<body>
  <div class="heart-stage">
    <div class="wrapper">
      <div class="heart"></div>
      <div class="heart-text">
        <h2 style="font-size: 1.8rem; margin: 0;">Happy Birthday, Dear Beastie! ❤️🎂</h2>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-heart.png" });
  await browser.close();
  console.log("Screenshot saved to test-heart.png");
}

testHeart();
