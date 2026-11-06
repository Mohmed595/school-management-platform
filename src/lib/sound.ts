// Utility for playing login and tab switch audio sounds across the application

export function playLoginSound(): void {
  try {
    const audio = new Audio('/login.mp3');
    audio.volume = 0.7;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        playSynthesizedChime(523.25, 1046.5, 0.5);
      });
    }
  } catch {
    playSynthesizedChime(523.25, 1046.5, 0.5);
  }
}

export function playSwitchTabSound(): void {
  try {
    const audio = new Audio('/switch tab.mp3');
    audio.volume = 0.5;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        playSynthesizedChime(800, 1200, 0.12);
      });
    }
  } catch {
    playSynthesizedChime(800, 1200, 0.12);
  }
}

/**
 * Subtle low-volume tactile click sound for buttons and confirmations
 */
export function playSoftClickSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    // Pleasant low-frequency gentle click (800Hz down to 400Hz in 40ms)
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    // Very low volume: 0.05
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Graceful silent fallback
  }
}

function playSynthesizedChime(startFreq: number, endFreq: number, duration: number): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio context autoplay restriction
  }
}
