import { chromium } from "playwright-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function findPerfectSymmetry() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
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
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-around;
    background: #080611;
    color: white;
  }
  .box {
    width: 320px;
    height: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid #333;
    position: relative;
  }
  .label {
    position: absolute;
    top: 10px;
    color: gold;
    font-size: 14px;
  }

  /* G1: User's exact code scaled x3 (w=150, h=210, top=51, left=-42, 50deg/-100deg) */
  .g1-wrapper { animation: pulse 0.7s infinite; }
  .g1-heart {
    height: 210px;
    width: 150px;
    background-color: hotpink;
    border-radius: 150px 150px 0 0;
    transform: rotate(50deg);
    position: relative;
    animation: shadow 0.7s infinite;
  }
  .g1-heart::after {
    position: absolute;
    top: 51px;
    left: -42px;
    content: '';
    height: inherit;
    width: inherit;
    background-color: inherit;
    border-radius: inherit;
    transform: rotate(-100deg);
    animation: shadow 0.7s infinite;
  }

  /* G2: 45deg & -90deg, exact top/left matching width/height (w=160, h=240) */
  .g2-wrapper { animation: pulse 0.7s infinite; }
  .g2-heart {
    height: 240px;
    width: 160px;
    background-color: hotpink;
    border-radius: 160px 160px 0 0;
    transform: rotate(45deg);
    position: relative;
    animation: shadow 0.7s infinite;
  }
  .g2-heart::after {
    position: absolute;
    top: 40px;
    left: -40px;
    content: '';
    height: inherit;
    width: inherit;
    background-color: inherit;
    border-radius: inherit;
    transform: rotate(-90deg);
    animation: shadow 0.7s infinite;
  }

  /* G3: 45deg & -90deg, with top=left offset equal to (H - W)/2 or exact geometry */
  /* For w=160, h=240: (240 - 160) = 80px difference. When rotated 90deg, offset is (H - W)/sqrt(2) approx */
  .g3-wrapper { animation: pulse 0.7s infinite; }
  .g3-heart {
    height: 220px;
    width: 150px;
    background-color: hotpink;
    border-radius: 150px 150px 0 0;
    transform: rotate(45deg);
    position: relative;
    animation: shadow 0.7s infinite;
  }
  .g3-heart::after {
    position: absolute;
    top: 35px;
    left: -35px;
    content: '';
    height: inherit;
    width: inherit;
    background-color: inherit;
    border-radius: inherit;
    transform: rotate(-90deg);
    animation: shadow 0.7s infinite;
  }

  /* G4: Perfectly symmetrical 45deg:
     Let width=160, height=220.
     If transform-origin is 50% 50%:
     top = (H - W) / 2 = 30px
     left = -(H - W) / 2 = -30px
  */
  .g4-wrapper { animation: pulse 0.7s infinite; }
  .g4-heart {
    height: 200px;
    width: 140px;
    background-color: hotpink;
    border-radius: 140px 140px 0 0;
    transform: rotate(45deg);
    position: relative;
    animation: shadow 0.7s infinite;
  }
  .g4-heart::after {
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

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    70% { transform: scale(1.18); }
    100% { transform: scale(1); }
  }
  @keyframes shadow {
    0% { box-shadow: 0 0 0 0 hotpink; }
    50% { box-shadow: 0 0 15px 0 hotpink; }
    70% { box-shadow: 0 0 30px 10px hotpink; }
    95% { box-shadow: 0 0 80px 2px hotpink; }
  }
</style>
</head>
<body>
  <div class="box"><div class="label">G1 (Original scaled)</div><div class="g1-wrapper"><div class="g1-heart"></div></div></div>
  <div class="box"><div class="label">G2 (w=160 h=240 top=40 left=-40)</div><div class="g2-wrapper"><div class="g2-heart"></div></div></div>
  <div class="box"><div class="label">G3 (w=150 h=220 top=35 left=-35)</div><div class="g3-wrapper"><div class="g3-heart"></div></div></div>
  <div class="box"><div class="label">G4 (w=140 h=200 top=30 left=-30)</div><div class="g4-wrapper"><div class="g4-heart"></div></div></div>
</body>
</html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(600);
  await page.screenshot({ path: "test-symmetry.png" });
  await browser.close();
  console.log("Screenshot saved to test-symmetry.png");
}

findPerfectSymmetry();
