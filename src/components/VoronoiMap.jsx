// src/components/VoronoiMap.jsx
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

function FitToData({ data }) {
  const map = useMap();
  useEffect(() => {
    if (!data) return;
    const layer = L.geoJSON(data);
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  }, [data, map]);
  return null;
}

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

export default function VoronoiMap() {
  const [geo, setGeo] = useState(null);

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

    layer.bindPopup(
      `<b>Population (mean) density</b><br/>
       mean: ${fmt(p.mean)} / km²<br/>
       median: ${fmt(p.median)} / km²<br/>
       min: ${fmt(p.min)} / km² · max: ${fmt(p.max)} / km²<br/>
       area: ${Math.round(p.area_km2)} km²<br/>
       pop_est: ${p.pop_est?.toLocaleString?.() ?? '—'}`
    );
  };

  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      style={{ height: '100vh', width: '100%' }}
      preferCanvas
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {geo && (
        <>
          <GeoJSON data={geo} style={styleFn} onEachFeature={onEach} />
          <FitToData data={geo} />
          <Legend />
        </>
      )}
    </MapContainer>
  );
}
