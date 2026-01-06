import { useState } from 'react'
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
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App