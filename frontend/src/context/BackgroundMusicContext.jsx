import { createContext, useContext, useRef, useEffect } from 'react';
import backgroundMusic from '../assets/sound_effects/background_music.mp3';

const BackgroundMusicContext = createContext();

export function BackgroundMusicProvider({ children }) {
  const bgMusicRef = useRef(null);

  useEffect(() => {
    // Setup background music
    bgMusicRef.current = new Audio(backgroundMusic);
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.15;
    
    // Attempt to play on load
    bgMusicRef.current.play().catch(() => {
      // Music will start after first user interaction
    });

    // Start music on first user interaction if not already playing
    const startMusicOnInteraction = () => {
      if (bgMusicRef.current && bgMusicRef.current.paused) {
        bgMusicRef.current.play().catch(() => {
          // ignore errors
        });
      }
      document.removeEventListener('click', startMusicOnInteraction);
    };

    document.addEventListener('click', startMusicOnInteraction);

    return () => {
      document.removeEventListener('click', startMusicOnInteraction);
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    };
  }, []);

  const pauseMusic = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
    }
  };

  const resumeMusic = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.play().catch(() => {
        // ignore errors
      });
    }
  };

  return (
    <BackgroundMusicContext.Provider value={{ pauseMusic, resumeMusic }}>
      {children}
    </BackgroundMusicContext.Provider>
  );
}

export function useBackgroundMusic() {
  return useContext(BackgroundMusicContext);
}
