import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './App.css'

// --- PAGES --–
import Home from './pages/Home'
import Game from "./pages/Game/Game";
import CreatePlayer from './pages/Create_Player/Create_Player.jsx'
import Start from './pages/Start.jsx' 
import LoginPage from './pages/LoginPage/LoginPage';
import SignUpPage from "./pages/SignUpPage/SignUp";
import Completed from "./pages/Completed/Completed.jsx";
import PlayerProfile from "./pages/PlayerProfile.jsx";
import GameModes from "./pages/GameModes";
import Lobby from './pages/lobby/Lobby.jsx'; // <--- ADD THIS IMPORT

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
  },
  // --- ADD THIS ROUTE BLOCK ---
  {
    path: '/lobby', 
    element: <Lobby />
  }
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App