import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
       <div className="app">
        <h1 className="main-title">Sadness</h1>
        <button className="main-button">Feel the Pain</button>
      </div>
      <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

      </MapContainer>
    </>
  )
}

export default App
