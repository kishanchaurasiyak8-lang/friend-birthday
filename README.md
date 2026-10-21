# 🌟 A MIDNIGHT LUXURY BIRTHDAY SURPRISE FOR BEASTIE ❤️

A premium, cinematic, intimate birthday website dedicated to your one and only female best friend, lovingly called **"Beastie."**

Designed with an elegant, dramatic, and expensive midnight aesthetic — reminiscent of a private birthday celebration under the midnight stars with champagne gold, deep royal purple, and warm ivory.

---

## 🎨 Midnight Luxury Visual Identity

- **Near-Black Backgrounds**: `#09070F`
- **Deep Royal Purple**: `#211038` / `#120924`
- **Champagne Gold**: `#D4AF62` (with highlights in `#EAD59E` and `#F3E2B8`)
- **Warm Ivory Typography**: `#F3E9D7`
- **Typography**: Regal serif headings (`Cinzel`, `Cormorant Garamond`, `Playfair Display`), crisp body text (`Plus Jakarta Sans`), and handwritten memories (`Caveat`).
- **Atmosphere**: Subtle purple spotlight illumination, floating golden stardust, tiny stars, gentle light rays, and restrained golden confetti.

---

## 🌟 The Complete Experience Sequence

1. **Cinematic Hero Opening 🌟**
   - Dramatic full-screen entrance with purple spotlight and golden particles.
   - Elegant headline: *"Happy Birthday, Dear Beastie"*.
   - Call-to-action button: **"Enter the Celebration"**.
2. **10-Second Midnight Countdown ⏳**
   - Automatic luxury countdown with golden numbers (10 → 0).
   - Intensifies with starlight at 3, 2, 1, ending with a radiant golden heart flash.
   - Includes a discreet *"Skip to Midnight Surprise ✨"* button.
3. **Cinematic Beating Heart ❤️**
   - Glowing gold & amethyst neon heartbeat animation.
   - Initial quote: *"Some people make life more beautiful just by being in it. You're one of those people, Beastie. 💖"*
4. **Birthday Message Inside Heart 💗**
   - Typewriter effect inside the heart: *"Happy Birthday Dear Beastie ❤️"*.
   - Bestie joke and sincere appreciation cards in dark glassmorphism with gold borders.
   - Button: **"Let's Celebrate, Beastie! 🎂"**.
5. **Midnight Birthday Cake & Interactive Cutting 🎂🔪**
   - 2-tier midnight blackberry & cream cake on a champagne gold pedestal.
   - Lit candles with naturally flickering flames.
   - Animated chef's knife executes a real cutting motion; the wedge slice separates onto a golden saucer while candles blow out.
   - Celebratory golden confetti burst and messages appear.
   - Button: **"Time for Your Gifts! 🎁"**.
6. **Animated Birthday Gifts & Golden Envelopes 🎁**
   - 3 interactive luxury gifts:
     - **The Funny Gift 😂**: Midnight obsidian & gold box with funny birthday rule.
     - **The Friendship Gift 🥹**: Royal purple velvet box with sincere appreciation.
     - **The Memory Album 📸**: Closed golden envelope with wax seal that unclasps to open the memories.
7. **Luxury Scrapbook & Photo Gallery 📸💗**
   - Scrapbook cover: *"Our Little World of Memories ❤️"*.
   - 4 themed pages with working **Previous** and **Next** buttons.
   - Polaroid frames with thin gold borders, washi tape, dark velvet backgrounds, subtle hover zoom, and handwritten captions.
   - Button: **"One Last Surprise ✨"**.
8. **Final Emotional Birthday Letter & Virtual Hug 💝**
   - Shimmering midnight fireworks canvas and glowing golden lights.
   - Typewritten grand heading and full heartfelt birthday letter.
   - Glowing heart + highlight quote.
   - **Send a Virtual Birthday Hug 🤗**: Delivers confetti and an animated illustration of the two besties hugging.
   - **Replay Our Birthday Surprise 🔄**: Smoothly restarts the surprise from the beginning.
   - **Discrete Stage Navigation Bar**: Bottom champagne gold navigation pill allowing instant access to any scene at any time.

---

## 🎵 Music & Sound System

- **Off by default** (won't startle the visitor).
- Floating top-right audio pill with play/pause, animated champagne gold equalizer bars, and mute toggle.
- **Procedural Music Box Fallback**: Web Audio API generates a gentle music-box melody of "Happy Birthday" if no MP3 file is present.
- **Custom Music**: Drop an MP3 into `public/music/birthday-music.mp3` or configure `src/config.js` to play your own song.

---

## 🛠️ Personalization Guide

### 1. Edit Messages, Quotes, or Letters
Open `src/config.js`. Every message, joke, and paragraph is clearly labeled and editable.

### 2. Replace Placeholder Photos
1. Put your photos in `src/assets/images/` (e.g. `photo1.jpg`).
2. In `src/config.js`, set `image` in `album.pages`:
   ```javascript
   import myPhoto from "./assets/images/photo1.jpg";
   // inside page:
   image: myPhoto
   ```
3. If no image is provided, the website automatically displays handcrafted aesthetic placeholder illustrations.

---

## 🚀 Running the Project

```bash
# Start development server
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

Open `http://localhost:5173` in your browser to experience the celebration! 🌟
