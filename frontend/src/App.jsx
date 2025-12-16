import { useState } from 'react'
import './App.css'
import Home from './pages/Home'
import Game from './pages/Game/Game'

import {createBrowserRouter, RouterProvider} from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/game',
    element: <Game />
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
