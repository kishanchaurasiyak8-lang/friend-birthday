import fs from "fs";
import path from "path";

// Generate a gentle music box "Happy Birthday" instrumental WAV audio file
function createWavHeader(dataLength, sampleRate = 44100, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

const sampleRate = 44100;

// Note frequencies (Hz)
const N = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50
};

// Melody: [frequency, duration in seconds, harmonyFreq]
const score = [
  // Happy Birthday to you
  [N.G4, 0.45, N.C4], [N.G4, 0.25], [N.A4, 0.65, N.E4], [N.G4, 0.65], [N.C5, 0.65, N.E4], [N.B4, 1.3, N.G4],
  // Happy Birthday to you
  [N.G4, 0.45, N.G4], [N.G4, 0.25], [N.A4, 0.65, N.F4], [N.G4, 0.65], [N.D5, 0.65, N.F4], [N.C5, 1.3, N.E4],
  // Happy Birthday dear Beastie
  [N.G4, 0.45, N.C4], [N.G4, 0.25], [N.G5, 0.65, N.E4], [N.E5, 0.65, N.G4], [N.C5, 0.65, N.A4], [N.B4, 0.65, N.E4], [N.A4, 1.1, N.F4],
  // Happy Birthday to you
  [N.F5, 0.45, N.F4], [N.F5, 0.25], [N.E5, 0.65, N.C5], [N.C5, 0.65, N.E4], [N.D5, 0.65, N.G4], [N.C5, 1.8, N.C4],
  // Brief pause before repeat
  [0, 0.6]
];

// Calculate total length
const totalSeconds = score.reduce((acc, curr) => acc + curr[1], 0);
const totalSamples = Math.ceil(totalSeconds * sampleRate);
const sampleBuffer = new Float32Array(totalSamples);

let currentSampleIndex = 0;
for (const [freq, dur, harmony] of score) {
  const noteSamples = Math.floor(dur * sampleRate);
  for (let i = 0; i < noteSamples; i++) {
    const idx = currentSampleIndex + i;
    if (idx >= totalSamples) break;

    const t = i / sampleRate;
    if (freq > 0) {
      // Bell/music box timbre: fundamental sine + 2nd octave harmonic + exponential decay
      const decay = Math.exp(-t * 2.8);
      const wave = Math.sin(2 * Math.PI * freq * t) * 0.45 +
                   Math.sin(2 * Math.PI * freq * 2 * t) * 0.15;
      sampleBuffer[idx] += wave * decay;
    }

    if (harmony && harmony > 0) {
      const harmDecay = Math.exp(-t * 2.2);
      const harmWave = Math.sin(2 * Math.PI * harmony * t) * 0.25;
      sampleBuffer[idx] += harmWave * harmDecay;
    }
  }
  currentSampleIndex += noteSamples;
}

// Convert float samples (-1.0 to 1.0) to 16-bit PCM
const pcmBuffer = Buffer.alloc(totalSamples * 2);
for (let i = 0; i < totalSamples; i++) {
  let s = Math.max(-1, Math.min(1, sampleBuffer[i]));
  const intVal = s < 0 ? s * 0x8000 : s * 0x7fff;
  pcmBuffer.writeInt16LE(Math.floor(intVal), i * 2);
}

const header = createWavHeader(pcmBuffer.length, sampleRate, 1, 16);
const finalAudio = Buffer.concat([header, pcmBuffer]);

// Ensure destination directories exist
const publicMusicDir = "d:/Antigravity project/public/music";
const srcMusicDir = "d:/Antigravity project/src/assets/music";
if (!fs.existsSync(publicMusicDir)) fs.mkdirSync(publicMusicDir, { recursive: true });
if (!fs.existsSync(srcMusicDir)) fs.mkdirSync(srcMusicDir, { recursive: true });

fs.writeFileSync(path.join(publicMusicDir, "happy-birthday.mp3"), finalAudio);
fs.writeFileSync(path.join(srcMusicDir, "happy-birthday.mp3"), finalAudio);

const readmeText = `
================================================================================
HAPPY BIRTHDAY MUSIC TRACK
================================================================================
A gentle, royalty-free "Happy Birthday" instrumental music box track has been
placed in this folder as 'happy-birthday.mp3'.

HOW TO REPLACE WITH YOUR OWN SONG:
1. Drop your favorite recording into this folder:
   - public/music/happy-birthday.mp3
   - src/assets/music/happy-birthday.mp3
2. Make sure it is named 'happy-birthday.mp3' (or update src/config.js).
3. The website will automatically play your new custom music track!
================================================================================
`;

fs.writeFileSync(path.join(publicMusicDir, "README.txt"), readmeText);
fs.writeFileSync(path.join(srcMusicDir, "README.txt"), readmeText);

console.log(`Generated happy-birthday.mp3 (${finalAudio.length} bytes, ~${totalSeconds.toFixed(1)}s)`);
