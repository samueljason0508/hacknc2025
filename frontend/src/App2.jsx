import { useState } from 'react'
import './Main.css'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'


function App2() {
  const [count, setCount] = useState(0)

  return (
    <>
       <div className="app">
        <h1 className="main-title">Sadness</h1>
        <button className="main-button">Feel the Pain</button>
      </div>
    </>
  )
}

export default App2