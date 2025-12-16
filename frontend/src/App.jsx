import { useState } from 'react'
import './App.css'
import Home from './pages/Home'
import Start from './pages/Start' 

import {createBrowserRouter, RouterProvider} from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
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
