// MapView.jsx
import { MapContainer, TileLayer, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import Navbar from './Navbar'; 

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
  const [data, setData] = useState(null);

  useMapEvents({
    click: async (e) => {
      setPosition(e.latlng);
      
      // Call the backend API
      try {
        const response = await fetch('/api/mapOnClick', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: e.latlng.lat,
            lng: e.latlng.lng
          })
        });
        
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Error calling map controller:', error);
      }
    },
  });

  return (
    position && (
      <Popup position={position}>
        <div>
          <p>You clicked at {position.lat.toFixed(4)}, {position.lng.toFixed(4)}</p>
          {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        </div>
      </Popup>
    )
  );
}
