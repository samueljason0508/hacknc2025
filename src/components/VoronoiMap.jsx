import { MapContainer, TileLayer, GeoJSON, Marker, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useCallback } from 'react';
import Navbar from './Navbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useUserWeights } from '../services/userWeights';
import { computeFrustration, colorForSigned } from '../utils/frustrationIndex';

// red marker
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitToData({ data }) {
  const map = useMap();
  useEffect(() => {
    if (!data) return;
    const layer = L.geoJSON(data);
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  }, [data, map]);
  return null;
}

// Legend for signed score –10..+10
function LegendSigned() {
  const map = useMap();
  useEffect(() => {
    const rows = [
      { c: '#2DC937', label: '≤ –8' },
      { c: '#7DCB3A', label: '–8 to –4' },
      { c: '#C9D73A', label: '–4 to 0' },
      { c: '#E7B416', label: '0 to +4' },
      { c: '#DB7B2B', label: '+4 to +8' },
      { c: '#CC3232', label: '≥ +8' },
    ];
    const div = L.DomUtil.create('div', 'info legend');
    Object.assign(div.style, {
      background: 'white',
      padding: '8px',
      borderRadius: '6px',
      lineHeight: '1.2',
    });
    div.innerHTML =
      `<div><b>Pleasant ↔ Frustrating</b></div>` +
      rows
        .map(
          (r) =>
            `<div><span style="background:${r.c};display:inline-block;width:12px;height:12px;margin-right:6px;"></span>${r.label}</div>`
        )
        .join('') +
      `<div style="margin-top:4px;font-size:11px;">–10 pleasing · +10 frustrating</div>`;
    const ctrl = L.control({ position: 'bottomright' });
    ctrl.onAdd = () => div;
    ctrl.addTo(map);
    return () => ctrl.remove();
  }, [map]);
  return null;
}

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

  // Style using the modular score (today only density -> later add AQI/noise/rent/transit)
  const styleFn = (f) => {
    const p = f?.properties ?? {};
    const raw = {
      densityMean: p.mean,  // what we have in the GeoJSON
      // aqi: ??? (later)
      // noiseDb: ??? (later)
      // rentUsd: ??? (later)
      // transitGood01: ??? (later)
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
    const p = f.properties ?? {};
    const raw = { densityMean: p.mean };
    const { scoreSigned, parts, weights: w } = computeFrustration(raw, weights);

    const fmt = (x, d = 2) =>
      typeof x === 'number' && Number.isFinite(x) ? x.toFixed(d) : '—';

    // Allow polygon clicks to also set marker/side panel, if you want:
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
      <Navbar data={data} />
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[39.5, -98.35]}
          zoom={5}
          minZoom={5}
          maxBounds={[[24, -125], [50, -66]]}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
          preferCanvas
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {geo && (
            <>
              <GeoJSON
                data={geo}
                style={styleFn}
                onEachFeature={onEach}
                bubblingMouseEvents={true}
              />
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
