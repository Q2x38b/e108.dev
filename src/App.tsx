import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import BlogList from './pages/BlogList'
import BlogPost from './pages/BlogPost'
import BlogEditor from './pages/BlogEditor'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/new" element={<BlogEditor />} />
      <Route path="/blog/edit/:slug" element={<BlogEditor />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
    </Routes>
  )
}

export default App
