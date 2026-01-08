import { useState, useEffect, useRef } from 'react'
import './App.css'
import Home from './pages/Home/Home.jsx'
import Game from "./pages/Game/Game";
import CreatePlayer from './pages/Create_Player/Create_Player.jsx'
import Start from './pages/Start/Start.jsx' 
import LoginPage from './pages/LoginPage/LoginPage';
import SignUpPage from "./pages/SignUpPage/SignUp";
import Completed from "./pages/Completed/Completed.jsx";
import PlayerProfile from "./pages/PlayerProfile/PlayerProfile.jsx";
import GameModes from "./pages/GameModes/GameModes.jsx";
import btnClick from './assets/sound_effects/btn_click.mp3';
import { BackgroundMusicProvider } from './context/BackgroundMusicContext';

import {createBrowserRouter, RouterProvider} from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/game',
    element: <Game />
  }, 
  {
    path: '/completed',
    element: <Completed />
  },
  {
    path: '/create-player',
    element: <CreatePlayer />
  },
  {
    path: '/profile',
    element: <PlayerProfile />
  },
  {
    path: '/start', 
    element: <Start />
  },
  {
    path: '/game-modes',
    element: <GameModes />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignUpPage />
  }
]);

function App() {
  const btnAudioRef = useRef(null);

  useEffect(() => {
    // Setup background music
    btnAudioRef.current = new Audio(btnClick);
    btnAudioRef.current.volume = 0.3;

    const handler = (e) => {
      const el = e.target.closest && e.target.closest('[data-audio="btn"], .start-btn');
      if (!el) return;

      try {
        btnAudioRef.current.currentTime = 0;
        btnAudioRef.current.play();
      } catch (err) {
        // ignore play promise errors
      }
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <BackgroundMusicProvider>
      <RouterProvider router={router} />
    </BackgroundMusicProvider>
  )
}

export default App