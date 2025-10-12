import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './Home'
import Login from './Login'
import Survey from './Survey'
import VoronoiMap from './components/VoronoiMap'

function App() {
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/map" element={<VoronoiMap />} />
      </Routes>
    </Router>
  )
}

export default App

