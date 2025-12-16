import { useState } from 'react'
import './App.css'
import Home from './pages/Home'

import {createBrowserRouter, RouterProvider} from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
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
