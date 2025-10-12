// distanceFromGroceryStore.js
const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function getDistanceToNearestGrocery(lat, lng, {
  mode = "driving",
  units = "imperial",            // "imperial" or "metric"
  key = GMAPS_KEY
} = {}) {
  if (!key) return { error: "Missing Google Maps API key." };

  // 1) Places Nearby: closest supermarket (ranked by distance)
  const nearbyUrl =
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json" +
    `?location=${lat},${lng}` +
    `&rankby=distance` +
    `&type=supermarket` +        // reliable category
    `&keyword=grocery` +         // optional nudge
    `&key=${key}`;

  const nearbyRes = await fetch(nearbyUrl);
  if (!nearbyRes.ok) return { error: `Places API error: ${nearbyRes.status}` };
  const nearby = await nearbyRes.json();

  if (!nearby.results?.length) return { error: "No grocery stores found nearby." };

  const store = nearby.results[0];
  const placeId = store.place_id;

  // 2) Distance Matrix: distance + ETA (traffic-aware if driving)
  const dmParams = new URLSearchParams({
    origins: `${lat},${lng}`,
    destinations: `place_id:${placeId}`,
    mode,
    units,
    key
  });
  if (mode === "driving") {
    dmParams.set("departure_time", "now");
    dmParams.set("traffic_model", "best_guess");
  }

  const dmUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?${dmParams.toString()}`;
  const dmRes = await fetch(dmUrl);
  if (!dmRes.ok) return { error: `Distance Matrix error: ${dmRes.status}` };
  const dm = await dmRes.json();

  const el = dm?.rows?.[0]?.elements?.[0];
  if (!el || el.status !== "OK") return { error: "Could not compute distance." };

  const duration = el.duration_in_traffic || el.duration;

  return {
    storeName: store.name ?? null,
    address: store.vicinity ?? null,     // Nearby Search returns 'vicinity'
    placeId,
    distance_meters: el.distance?.value ?? null,
    distance_text: el.distance?.text ?? null,
    duration_seconds: duration?.value ?? null,
    duration_text: duration?.text ?? null,
    mode,
    units
  };
}