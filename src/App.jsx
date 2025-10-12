import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import MapView from './components/MapView.jsx';
import './App.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <h1 className="main-title">Sadness</h1>
      <button className="main-button" onClick={() => navigate('/map')}>
        Feel the Pain
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapView />} />
      </Routes>
    </Router>
  );
}
