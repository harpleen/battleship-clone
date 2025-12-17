import { useState } from 'react'
import './App.css'
import Home from './pages/Home'
import Game from './pages/Game/Game'
import CreatePlayer from './pages/Create_Player.jsx'
import Start from './pages/Start.jsx' 
import Completed from "./pages/Completed.jsx";

import {createBrowserRouter, RouterProvider} from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/home',
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
