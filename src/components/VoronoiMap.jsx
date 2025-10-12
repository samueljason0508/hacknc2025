// src/components/MapView.jsx
import { MapContainer, TileLayer, GeoJSON, Marker, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useCallback } from 'react';
import Navbar from './Navbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create a red marker icon
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}); 


// --- color scale for population density "mean" ---
function colorForMean(m = 0) {
  return m > 3000 ? '#200009' :
         m > 2000 ? '#430014' :
         m > 1000 ? '#800026' :
         m >  200 ? '#BD0026' :
         m >   50 ? '#E31A1C' :
         m >   10 ? '#FC4E2A' :
         m >    1 ? '#FD8D3C' : '#FEB24C';
}

// Fit the map to the loaded GeoJSON data
function FitToData({ data }) {
  const map = useMap();
  useEffect(() => {
    if (!data) return;
    const layer = L.geoJSON(data);
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  }, [data, map]);
  return null;
}

// Add a legend to the map
function Legend() {
  const map = useMap();
  useEffect(() => {
    const div = L.DomUtil.create('div', 'info legend');
    div.style.background = 'white';
    div.style.padding = '8px';
    div.style.borderRadius = '6px';
    div.style.lineHeight = '1.2';

    const rows = [
      { c: '#200009', label: '> 3000' },
      { c: '#430014', label: '2001–3000' },
      { c: '#800026', label: '1001–2000' },
      { c: '#BD0026', label: '201–1000' },
      { c: '#E31A1C', label: '51–200' },
      { c: '#FC4E2A', label: '11–50' },
      { c: '#FD8D3C', label: '1–10' },
      { c: '#FEB24C', label: '≤ 1' }
    ];

    div.innerHTML = `<div><b>Population density (mean, /km²)</b></div>` +
      rows.map(r =>
        `<div><span style="background:${r.c};display:inline-block;width:12px;height:12px;margin-right:6px;"></span>${r.label}</div>`
      ).join('');

    const ctrl = L.control({ position: 'bottomright' });
    ctrl.onAdd = () => div;
    ctrl.addTo(map);
    return () => ctrl.remove();
  }, [map]);
  return null;
}

// Reliable default marker icon (CDN)
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({ onClick }) {
  useMapEvents({
    click: (e) => onClick(e.latlng),
  });
  return null;
}

export default function MapView() {
  const [data, setData] = useState(null);
  const [geo, setGeo] = useState(null);
  const [position, setPosition] = useState(null);

  // Load base GeoJSON (place file in /public/voronoi_conus.geojson)
  useEffect(() => {
    fetch('/voronoi_conus.geojson')
      .then(r => {
        if (!r.ok) throw new Error(`GeoJSON ${r.status}`);
        return r.json();
      })
      .then(setGeo)
      .catch(err => console.error('GeoJSON load failed:', err));
  }, []);

  const styleFn = (f) => {
    const m = f?.properties?.mean;
    return {
      color: '#555',
      weight: 0.6,
      opacity: 1,
      fillOpacity: 0.65,
      fillColor: colorForMean(Number(m) || 0)
    };
  };

  const onEach = (f, layer) => {
    const p = f.properties ?? {};
    const fmt = (x, d = 2) =>
      typeof x === 'number' && Number.isFinite(x) ? x.toFixed(d) : '—';

    // layer.bindPopup(
    //   `<b>Population (mean) density</b><br/>
    //    mean: ${fmt(p.mean)} / km²<br/>
    //    median: ${fmt(p.median)} / km²<br/>
    //    min: ${fmt(p.min)} / km² · max: ${fmt(p.max)} / km²<br/>
    //    area: ${Math.round(p.area_km2)} km²<br/>
    //    pop_est: ${p.pop_est?.toLocaleString?.() ?? '—'}`
    // );

    // ALSO catch clicks on polygons (some setups stop bubbling)
    layer.on('click', (e) => handleClick(e.latlng));
  };

  // Single click handler used by both map background and polygons
  const handleClick = useCallback(async (latlng) => {
    setPosition(latlng);            // show marker immediately
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
      <Navbar data={data} />
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[39.5, -98.35]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          preferCanvas
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* GeoJSON overlay + legend */}
          {geo && (
            <>
              <GeoJSON
                data={geo}
                style={styleFn}
                onEachFeature={onEach}
                bubblingMouseEvents={true} // be explicit
              />
              <FitToData data={geo} />
              <Legend />
            </>
          )}

          {/* Catch clicks on bare map */}
          <MapClickHandler onClick={handleClick} />

          {/* Visualize the clicked point (both Marker and a tiny CircleMarker as fallback) */}
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
