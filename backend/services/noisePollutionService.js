import 'dotenv/config';

// Try the FeatureServer first; fall back to MapServer identify if needed.
const FEATURE_URL =
  process.env.NOISE_FEATURE_URL ||
  'https://geo.dot.gov/server/rest/services/Hosted/NTAD_Noise_2020_CONUS_Aviation_Road_Rail/FeatureServer/0';

const MAPSERVER_BASE =
  process.env.NOISE_MAPSERVER_URL ||
  'https://geo.dot.gov/server/rest/services/Hosted/NTAD_Noise_2020_CONUS_Aviation_Road_Rail/MapServer';

/** Small bbox around lat/lng for mapExtent (degrees). */
function makeExtent(lat, lng, halfSizeDeg = 0.1) {
  const xmin = lng - halfSizeDeg;
  const xmax = lng + halfSizeDeg;
  const ymin = lat - halfSizeDeg;
  const ymax = lat + halfSizeDeg;
  return `${xmin},${ymin},${xmax},${ymax}`;
}

async function queryFeatureServerPoint(lat, lng) {
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    outFields: '*',
    returnGeometry: 'false',
    spatialRel: 'esriSpatialRelIntersects',
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    geometry: JSON.stringify({
      x: lng,
      y: lat,
      spatialReference: { wkid: 4326 },
    }),
  });

  const url = `${FEATURE_URL}/query?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FeatureServer HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) {
    const details = Array.isArray(json.error.details) ? ` (${json.error.details.join('; ')})` : '';
    throw new Error(`FeatureServer error: ${json.error.message || 'Unknown'}${details}`);
  }

  const feat = json.features?.[0];
  if (!feat) {
    return { found: false, message: 'No modeled cell here (likely <45 dB or outside coverage).', attributes: null };
  }
  return { found: true, attributes: feat.attributes || {} };
}

async function identifyMapServerPoint(lat, lng) {
  const params = new URLSearchParams({
    f: 'json',
    geometryType: 'esriGeometryPoint',
    sr: '4326',
    geometry: JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } }),
    mapExtent: makeExtent(lat, lng, 0.1),
    imageDisplay: '800,600,96',
    tolerance: '5',
    returnGeometry: 'false',
    layers: 'all:0',
  });

  const url = `${MAPSERVER_BASE}/identify?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MapServer identify HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) {
    const details = Array.isArray(json.error.details) ? ` (${json.error.details.join('; ')})` : '';
    throw new Error(`MapServer identify error: ${json.error.message || 'Unknown'}${details}`);
  }

  const hit = Array.isArray(json.results) && json.results[0];
  if (!hit?.attributes) {
    return { found: false, message: 'No modeled cell here (identify returned nothing).', attributes: null };
  }
  return { found: true, layerName: hit.layerName, attributes: hit.attributes };
}

export async function getNoiseAtPoint(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('lat and lng must be numbers');
  }

  // Strategy A: FeatureServer /query
  try {
    return await queryFeatureServerPoint(lat, lng);
  } catch (e) {
    if (process.env.DEBUG_NOISE) console.error('[FeatureServer fallback]', e.message);
  }

  // Strategy B: MapServer /identify
  return await identifyMapServerPoint(lat, lng);
}

export async function getNearestNoiseHit(lat, lng, meters = 50) {
  const dLat = meters / 111_320;
  const dLng = meters / (111_320 * Math.cos((lat * Math.PI) / 180));
  const samples = [
    [lat, lng],
    [lat + dLat, lng],
    [lat - dLat, lng],
    [lat, lng + dLng],
    [lat, lng - dLng],
  ];
  for (const [la, ln] of samples) {
    const r = await getNoiseAtPoint(la, ln);
    if (r.found) return { ...r, sampledOffsetMeters: meters };
  }
  return {
    found: false,
    message: 'No modeled cell found at or near this point within the sample radius.',
    attributes: null,
  };
}
