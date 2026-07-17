import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { bind as bindSounds } from 'cuelume'
import { Agentation } from 'agentation'
import Home from './pages/Home'
import BlogList from './pages/BlogList'
import BlogPost from './pages/BlogPost'
import BlogEditor from './pages/BlogEditor'
import { BottomBlur } from './components/BottomBlur'
import './App.css'

function App() {
  // Delegated listeners for data-cuelume-* hover ticks; imperative
  // play() calls live next to their haptic counterparts.
  useEffect(() => {
    bindSounds()
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/new" element={<BlogEditor />} />
        <Route path="/blog/edit/:shortId" element={<BlogEditor />} />
        <Route path="/blog/:shortId" element={<BlogPost />} />
      </Routes>
      <BottomBlur />
      {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
    </MotionConfig>
  )
}

export default App
