// MapView.jsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import Navbar from './Navbar';
import L from 'leaflet';

// Create a red marker icon
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}); 

export default function MapView() {
  const [data, setData] = useState(null);
  
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Navbar data={data} />
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
          <ClickPopup setData={setData} />
        </MapContainer>
      </div>
    </div>
  );
}

function ClickPopup({ setData }) {
  const [position, setPosition] = useState(null);

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
        
        if (response.ok) {
          const json = await response.json();
          setData(json);
        } else {
          setData({ status: 'error', message: 'API unavailable' });
        }
      } catch (error) {
        console.error('Error calling map controller:', error);
        setData({ status: 'error', message: 'API connection failed' });
      }
    },
  });

  return (
    position && (
      <Marker position={position} icon={redIcon} />
    )
  );
}
