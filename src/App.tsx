import { Routes, Route } from 'react-router-dom'
import { Agentation } from 'agentation'
import Home from './pages/Home'
import BlogList from './pages/BlogList'
import BlogPost from './pages/BlogPost'
import BlogEditor from './pages/BlogEditor'
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/new" element={<BlogEditor />} />
        <Route path="/blog/edit/:shortId" element={<BlogEditor />} />
        <Route path="/blog/:shortId" element={<BlogPost />} />
      </Routes>
      {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
    </>
  )
}

export default App
