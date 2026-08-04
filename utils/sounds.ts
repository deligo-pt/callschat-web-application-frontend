// Utility to play standard notification sounds

export const playNotificationSound = (type: 'message' | 'call') => {
  if (typeof window === 'undefined') return;
  
  try {
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
    
    // Play the audio. Catch the error since browsers require user interaction
    // before allowing audio to play.
    audio.play().catch(err => {
      console.warn('Audio playback prevented by browser policy:', err);
    });

    // If it's a looping ringtone, we return the audio instance so it can be stopped manually
    return audio;
  } catch (err) {
    console.error('Failed to play notification sound', err);
  }
};
