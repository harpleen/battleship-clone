import { useState } from 'react'
import './App.css'
import Home from './pages/Home.jsx'
import CreatePlayer from './pages/Create_Player.jsx'


import {createBrowserRouter, RouterProvider} from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/create-player',
    element: <CreatePlayer />
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
