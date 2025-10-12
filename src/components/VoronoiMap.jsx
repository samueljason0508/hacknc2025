// src/components/VoronoiMap.jsx (or MapView.jsx)
import { MapContainer, TileLayer, GeoJSON, Marker, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useCallback } from 'react';
import Navbar from './Navbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useUserWeights } from '../services/userWeights';
import { computeFrustration, colorForSigned } from '../utils/frustrationIndex';

// --- red marker icon ---
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// --- fit map to geojson bounds ---
function FitToData({ data }) {
  const map = useMap();
  useEffect(() => {
    if (!data) return;
    const layer = L.geoJSON(data);
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  }, [data, map]);
  return null;
}

// --- legend (–10 .. +10) ---
function LegendSigned() {
  const map = useMap();
  useEffect(() => {
    const rows = [
      { c: '#2DC937', label: '≤ -7' },
      { c: '#7DCB3A', label: '-7 to -3' },
      { c: '#C9D73A', label: '-3 to 0' },
      { c: '#E7B416', label: '0 to +3' },
      { c: '#DB7B2B', label: '+3 to +7' },
      { c: '#CC3232', label: '≥ +7' },
    ];

    const div = L.DomUtil.create('div', 'info legend');
    Object.assign(div.style, {
      background: 'white',
      padding: '8px',
      borderRadius: '6px',
      lineHeight: '1.2',
    });

    div.innerHTML =
      '<div><b>Pleasant ↔ Frustrating</b></div>' +
      rows
        .map(
          (r) =>
            `<div><span style="background:${r.c};display:inline-block;width:12px;height:12px;margin-right:6px;"></span>${r.label}</div>`
        )
        .join('');

    const ctrl = L.control({ position: 'bottomright' });
    ctrl.onAdd = () => div;
    ctrl.addTo(map);
    return () => ctrl.remove();
  }, [map]);
  return null;
}

// --- click handler hook ---
function MapClickHandler({ onClick }) {
  useMapEvents({
    click: (e) => onClick(e.latlng),
  });
  return null;
}

// --- invalidate map size when sidebar collapses/expands ---
function MapResizer({ trigger }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize({ animate: false }), 220); // keep in sync with CSS transition
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

export default function MapView() {
  const [data, setData] = useState(null);
  const [geo, setGeo] = useState(null);
  const [position, setPosition] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const { weights } = useUserWeights();

  // Load base GeoJSON (served from /public)
  useEffect(() => {
    fetch('/voronoi_conus.geojson')
      .then((r) => {
        if (!r.ok) throw new Error(`GeoJSON ${r.status}`);
        return r.json();
      })
      .then(setGeo)
      .catch((err) => console.error('GeoJSON load failed:', err));
  }, []);

  // Style polygons using frustration score (currently using density mean from the file)
  const styleFn = (f) => {
    const p = f?.properties ?? {};
    const raw = {
      densityMean: p.mean, // available in your GeoJSON
      // aqi, noiseDb, rentUsd, transitGood01 can be added later
    };
    const { scoreSigned } = computeFrustration(raw, weights);
    return {
      color: '#555',
      weight: 0.6,
      opacity: 1,
      fillOpacity: 0.65,
      fillColor: colorForSigned(scoreSigned),
    };
  };

  const onEach = (f, layer) => {
    // allow polygon click to drive the sidebar
    layer.on('click', (e) => handleClick(e.latlng));
  };

  const handleClick = useCallback(async (latlng) => {
    setPosition(latlng);
    try {
      const response = await fetch('/api/mapOnClick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latlng.lat, lng: latlng.lng }),
      });
      if (response.ok) {
        setData(await response.json());
      } else {
        setData({ status: 'error', message: 'API unavailable' });
      }
    } catch (err) {
      console.error('Error calling map controller:', err);
      setData({ status: 'error', message: 'API connection failed' });
    }
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Pass collapsed + onToggle so the sidebar can control its state */}
      <Navbar data={data} collapsed={collapsed} onToggle={setCollapsed} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <MapContainer
          center={[39.5, -98.35]}
          zoom={5}
          minZoom={5}
          maxBounds={[[24, -125], [50, -66]]}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
          preferCanvas
        >
          {/* Recompute map size when sidebar opens/closes */}
          <MapResizer trigger={collapsed} />

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {geo && (
            <>
              <GeoJSON data={geo} style={styleFn} onEachFeature={onEach} bubblingMouseEvents />
              <FitToData data={geo} />
              <LegendSigned />
            </>
          )}

          <MapClickHandler onClick={handleClick} />

          {position && (
            <>
              <Marker position={position} icon={redIcon} />
              <CircleMarker center={position} radius={5} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
