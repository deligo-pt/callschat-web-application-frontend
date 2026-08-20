// =============================================================================
// Sound & Audio Feedback Engine (WhatsApp-Style Tone Synthesis)
// =============================================================================

export type NotificationSoundType =
  | 'message'
  | 'call'
  | 'busy'
  | 'call_ended'
  | 'call_waiting'
  | 'reconnecting';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
    return null;
  }
}

/**
 * Synthesizes dual-frequency telephony tones using Web Audio API.
 * Prevents audio clipping with smooth gain attack and release ramps.
 */
function synthesizeTones(
  frequencies: number[],
  durationMs: number,
  offsetMs: number = 0,
  volume: number = 0.25,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const startTime = ctx.currentTime + offsetMs / 1000;
  const stopTime = startTime + durationMs / 1000;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.001, startTime);
  masterGain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
  masterGain.gain.setValueAtTime(volume, stopTime - 0.015);
  masterGain.gain.linearRampToValueAtTime(0.001, stopTime);
  masterGain.connect(ctx.destination);

  frequencies.forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.connect(masterGain);
    osc.start(startTime);
    osc.stop(stopTime);
  });
}

/**
 * WhatsApp Busy Tone: 3 rapid dual-frequency bursts (480Hz + 620Hz).
 * Duration: 200ms on, 200ms off, repeated 3 times.
 */
export const playBusyTone = (): void => {
  const bursts = [0, 400, 800];
  bursts.forEach(offset => {
    synthesizeTones([480, 620], 200, offset, 0.22);
  });
};

/**
 * WhatsApp Call Ended Tone: Soft descending dual tone.
 * 480Hz (120ms) -> 350Hz (180ms).
 */
export const playCallEndedTone = (): void => {
  synthesizeTones([480], 120, 0, 0.2);
  synthesizeTones([350], 180, 140, 0.2);
};

/**
 * WhatsApp Call Waiting Tone: Subtle in-ear double pip.
 * Low volume so it does not drown out the ongoing call conversation.
 */
export const playCallWaitingTone = (): void => {
  synthesizeTones([425], 80, 0, 0.12);
  synthesizeTones([425], 80, 140, 0.12);
};

/**
 * Reconnecting Alert Tone: Subtle ascending double chirp.
 */
export const playReconnectingTone = (): void => {
  synthesizeTones([520], 80, 0, 0.15);
  synthesizeTones([650], 90, 100, 0.15);
};

/**
 * Primary sound player supporting audio assets and synthesized telephony tones.
 */
export const playNotificationSound = (
  type: NotificationSoundType,
): HTMLAudioElement | { stop: () => void } | undefined => {
  if (typeof window === 'undefined') return;

  try {
    if (type === 'busy') {
      playBusyTone();
      return { stop: () => {} };
    }

    if (type === 'call_ended') {
      playCallEndedTone();
      return { stop: () => {} };
    }

    if (type === 'call_waiting') {
      playCallWaitingTone();
      return { stop: () => {} };
    }

    if (type === 'reconnecting') {
      playReconnectingTone();
      return { stop: () => {} };
    }

    let audioSrc = '';
    let loop = false;

    if (type === 'message') {
      audioSrc = '/sounds/message-pop.mp3';
    } else if (type === 'call') {
      audioSrc = '/sounds/ringtone.mp3';
      loop = true;
    }

    if (!audioSrc) return;

    const audio = new Audio(audioSrc);
    audio.loop = loop;

    audio.play().catch(err => {
      console.warn('Audio playback prevented by browser policy:', err);
    });

    return audio;
  } catch (err) {
    console.error('Failed to play notification sound', err);
  }
};

