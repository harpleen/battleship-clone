import { useState } from 'react'
import './App.css'
import Home from './pages/Home'
import GamePage from './pages/GamePage/GamePage'
import Game from './pages/Game/Game'
import CreatePlayer from './pages/Create_Player.jsx'
import Start from './pages/Start.jsx' 

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
    path: '/gamepage',
    elemnt: <GamePage />
  }
  {
    path: '/create-player',
    element: <CreatePlayer />
  },
  {
    path: '/start', 
    element: <Start />
  }

])

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <RouterProvider router={router} />
    </>
  )
}

export default App