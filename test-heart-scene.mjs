import { chromium } from "playwright-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function testFullHeartScene() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Cormorant+Garamond:ital,wght@1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --color-midnight-black: #080611;
    --color-midnight-purple: #160B2B;
    --color-royal-purple: #5B21B6;
    --color-soft-violet: #A78BFA;
    --color-hot-pink: #FF69B4;
    --color-champagne-gold: #D4AF37;
    --color-bright-gold: #FFD700;
    --color-warm-ivory: #FFF8F0;

    --heart-w: clamp(140px, 32vw, 175px);
    --heart-h: calc(var(--heart-w) * 1.45);
    --heart-top: calc((var(--heart-h) - var(--heart-w)) / 2);
    --heart-left: calc(-1 * var(--heart-top));
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background-color: var(--color-midnight-black);
    color: var(--color-warm-ivory);
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow-x: hidden;
  }

  .heart-scene {
    position: relative;
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 15px;
    text-align: center;
    background: radial-gradient(circle at 50% 50%, rgba(91, 33, 182, 0.35) 0%, rgba(8, 6, 17, 0.98) 75%);
  }

  .step-progress-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 14px;
    border-radius: 20px;
    background: rgba(22, 11, 43, 0.85);
    border: 1px solid rgba(212, 175, 55, 0.4);
    color: #D4AF37;
    font-family: 'Cinzel', serif;
    font-size: 0.78rem;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  /* Main Heart Stage Container */
  .heart-stage-container {
    position: relative;
    width: clamp(340px, 92vw, 560px);
    height: clamp(340px, 85vw, 480px);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 5px 0 15px 0;
  }

  /* Soft violet ambient halo */
  .heart-violet-halo {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(91, 33, 182, 0.6) 0%, rgba(255, 105, 180, 0.2) 45%, rgba(8, 6, 17, 0) 70%);
    filter: blur(45px);
    pointer-events: none;
    z-index: 1;
  }

  /* Floating particles around heart */
  .floating-sparkle {
    position: absolute;
    pointer-events: none;
    z-index: 3;
    animation: floatDrift 4s ease-in-out infinite alternate;
  }

  @keyframes floatDrift {
    0% { transform: translateY(0) scale(0.9); opacity: 0.4; }
    50% { opacity: 0.95; }
    100% { transform: translateY(-25px) scale(1.15); opacity: 0.3; }
  }

  /* --- EXACT SPECIFICATION CSS HEART --- */
  .wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulse 0.7s infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .wrapper-outline-purple {
    z-index: 4;
    animation: pulse 0.7s infinite, outlinePurplePulse 2.5s ease-in-out infinite alternate;
  }

  .wrapper-outline-gold {
    z-index: 5;
    animation: pulse 0.7s infinite, outlineGoldPulse 2.8s ease-in-out infinite alternate;
  }

  .heart {
    height: var(--heart-h);
    width: var(--heart-w);
    margin: auto;
    background-color: hotpink;
    border-radius: var(--heart-w) var(--heart-w) 0 0;
    transform: rotate(45deg);
    position: relative;
    animation: shadow 0.7s infinite;
  }

  .heart::after {
    position: absolute;
    top: var(--heart-top);
    left: var(--heart-left);
    content: '';
    height: inherit;
    width: inherit;
    background-color: inherit;
    border-radius: inherit;
    transform: rotate(-90deg);
    animation: shadow 0.7s infinite;
  }

  /* Decorative outlines */
  .outline-purple-heart {
    background-color: transparent !important;
    border: 2px solid rgba(167, 139, 250, 0.45) !important;
    box-shadow: 0 0 30px rgba(91, 33, 182, 0.6) !important;
    transform: scale(1.12) rotate(45deg) !important;
  }
  .outline-purple-heart::after {
    background-color: transparent !important;
    border: 2px solid rgba(167, 139, 250, 0.45) !important;
    box-shadow: 0 0 30px rgba(91, 33, 182, 0.6) !important;
    transform: rotate(-90deg) !important;
  }

  .outline-gold-heart {
    background-color: transparent !important;
    border: 1.5px dashed rgba(255, 215, 0, 0.5) !important;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4) !important;
    transform: scale(1.06) rotate(45deg) !important;
  }
  .outline-gold-heart::after {
    background-color: transparent !important;
    border: 1.5px dashed rgba(255, 215, 0, 0.5) !important;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4) !important;
    transform: rotate(-90deg) !important;
  }

  @keyframes pulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.08);
    }
    70% {
      transform: translate(-50%, -50%) scale(1.15);
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes shadow {
    0% {
      box-shadow: 
        0 0 0 0 hotpink,
        0 0 0 0 rgba(212, 175, 55, 0.4),
        0 0 0 0 rgba(91, 33, 182, 0.3);
    }
    50% {
      box-shadow: 
        0 0 16px 2px hotpink,
        0 0 25px 5px rgba(255, 215, 0, 0.5),
        0 0 35px 8px rgba(91, 33, 182, 0.5);
    }
    70% {
      box-shadow: 
        0 0 35px 8px hotpink,
        0 0 45px 12px rgba(255, 215, 0, 0.6),
        0 0 65px 16px rgba(91, 33, 182, 0.6);
    }
    95% {
      box-shadow: 
        0 0 90px 4px hotpink,
        0 0 70px 18px rgba(255, 215, 0, 0.75),
        0 0 95px 24px rgba(91, 33, 182, 0.7);
    }
    100% {
      box-shadow: 
        0 0 0 0 hotpink,
        0 0 0 0 rgba(212, 175, 55, 0.4),
        0 0 0 0 rgba(91, 33, 182, 0.3);
    }
  }

  /* Centered Text Overlay DIRECTLY Inside the Heart */
  .heart-text-overlay {
    position: absolute;
    top: 48%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 30;
    width: clamp(230px, 75%, 310px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    pointer-events: none;
  }

  .heart-sparkle-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #FFD700;
    font-size: clamp(0.7rem, 2vw, 0.8rem);
    font-weight: 700;
    letter-spacing: 2px;
    font-family: 'Cinzel', serif;
    margin-bottom: 6px;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.9);
  }

  .heart-main-heading {
    font-size: clamp(1.2rem, 3.8vw, 1.75rem);
    font-weight: 800;
    color: #FFF8F0;
    line-height: 1.25;
    font-family: 'Cinzel', serif;
    letter-spacing: 0.5px;
    text-shadow: 
      0 0 15px #FFD700,
      0 0 30px #FF69B4,
      0 2px 6px rgba(0, 0, 0, 0.95);
    margin-bottom: 6px;
  }

  .heart-subtitle-inside {
    font-size: clamp(0.72rem, 2vw, 0.85rem);
    color: #FFF8F0;
    font-weight: 600;
    line-height: 1.35;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 0.9);
    max-width: 92%;
  }

  /* Glass Supporting Cards */
  .glass-card {
    background: rgba(22, 11, 43, 0.75);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 16px;
    padding: 14px 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.7);
    text-align: left;
    width: 100%;
  }

  .btn-gold {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 40px;
    font-family: 'Cinzel', serif;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #080611;
    background: linear-gradient(135deg, #FFF8F0, #FFD700 40%, #D4AF37 80%);
    border: 1px solid #FFD700;
    border-radius: 40px;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.35);
  }
</style>
</head>
<body>
  <div class="heart-scene">
    <div class="step-progress-badge">
      <span>02 / 08</span> • <span>Animated Heart</span>
    </div>

    <p style="color: #A78BFA; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: clamp(1.05rem, 3vw, 1.25rem); max-width: 600px; margin-bottom: 10px;">
      "Some people make life more beautiful just by being in it. You're one of those people, Beastie. 💖"
    </p>

    <!-- HEART STAGE -->
    <div class="heart-stage-container">
      <div class="heart-violet-halo"></div>

      <!-- Drifting sparkle stars -->
      <div class="floating-sparkle" style="top: 15%; left: 10%; color: #FFD700; font-size: 22px;">✦</div>
      <div class="floating-sparkle" style="top: 25%; right: 12%; color: #FF69B4; font-size: 18px; animation-delay: 1s;">❤️</div>
      <div class="floating-sparkle" style="bottom: 18%; left: 14%; color: #FFD700; font-size: 16px; animation-delay: 2s;">✨</div>
      <div class="floating-sparkle" style="bottom: 22%; right: 10%; color: #A78BFA; font-size: 20px; animation-delay: 1.5s;">✦</div>

      <!-- Outlines behind main heart -->
      <div class="wrapper wrapper-outline-purple">
        <div class="heart outline-purple-heart"></div>
      </div>
      <div class="wrapper wrapper-outline-gold">
        <div class="heart outline-gold-heart"></div>
      </div>

      <!-- THE CORE USER CSS HEART WITH CENTERED TEXT -->
      <div class="wrapper wrapper-main">
        <div class="heart"></div>

        <div class="heart-text-overlay">
          <div class="heart-sparkle-tag">
            <span>✦ MIDNIGHT MAGIC ✦</span>
          </div>
          <h2 class="heart-main-heading">Happy Birthday, Dear Beastie! ❤️🎂</h2>
          <p class="heart-subtitle-inside">
            To my one and only Beastie — a little crazy, a little dramatic, and a whole lot of amazing! 😂💖
          </p>
        </div>
      </div>
    </div>

    <!-- Supporting Cards Below -->
    <div style="max-width: 600px; width: 92%; display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
      <div class="glass-card" style="border-left: 3px solid #FFD700;">
        <p style="color: #FFF8F0; font-weight: 500;">
          Officially older, but don't worry... your craziness is still young! 😂🎉
        </p>
      </div>

      <div class="glass-card" style="border-left: 3px solid #FF69B4;">
        <p style="color: #A78BFA; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.05rem;">
          "Jokes apart, I'm genuinely lucky to have you as my best friend. Never stop being the amazing person you are. 🥹💖"
        </p>
      </div>

      <button class="btn-gold" style="margin-top: 6px;">
        <span>Continue the Magic ✨</span>
      </button>
    </div>
  </div>
</body>
</html>
  `;

  // Desktop render
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktopPage.setContent(html);
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: "test-heart-scene-desktop.png" });

  // Mobile render
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobilePage.setContent(html);
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: "test-heart-scene-mobile.png" });

  await browser.close();
  console.log("Screenshots captured for centered heart scene test!");
}

testFullHeartScene();
