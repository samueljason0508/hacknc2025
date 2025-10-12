// MapView.jsx
import { MapContainer, TileLayer, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import Navbar from './Navbar'; // ← Import the new Navbar component

export default function MapView() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[51.505, -0.09]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickPopup />
        </MapContainer>
      </div>
    </div>
  );
}

function ClickPopup() {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return (
    position && (
      <Popup position={position}>
        You clicked at {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
      </Popup>
    )
  );
}
