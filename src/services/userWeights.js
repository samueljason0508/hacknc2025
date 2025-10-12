// src/services/userWeights.js
import { useEffect, useMemo, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { DEFAULT_WEIGHTS } from '../utils/frustrationIndex';

/**
 * Expect a Firestore doc at:
 *   collection: "frustrationInfo"
 *   doc id: auth.currentUser.uid
 * Suggested schema (example):
 * {
 *   weights: { density:0..1, aqi:0..1, noise:0..1, rent:0..1, transit:0..1 }
 *   // OR legacy fields you already saved:
 *   populationdensity: 1..10,
 *   moodLevel: 1..10,
 *   // you can add: aqiPref, noisePref, rentPref, transitPref  (1..10)
 * }
 */
export function useUserWeights() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setWeights(DEFAULT_WEIGHTS);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'frustrationInfo', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setLoading(false);
      if (!snap.exists()) {
        setWeights(DEFAULT_WEIGHTS);
        return;
      }
      const data = snap.data() || {};

      // 1) Direct weights if present
      if (data.weights && typeof data.weights === 'object') {
        setWeights(normalizeWeights(data.weights));
        return;
      }

      // 2) Legacy mapping: any 1..10 sliders → weights
      // If you only have populationdensity and moodLevel for now, use PD to weight "density",
      // and use moodLevel to spread evenly across the rest.
      const pd = num01(data.populationdensity);
      const mood = num01(data.moodLevel);

      // future: aqiPref, noisePref, rentPref, transitPref (1..10)
      const aqiPref = num01(data.aqiPref);
      const noisePref = num01(data.noisePref);
      const rentPref = num01(data.rentPref);
      const transitPref = num01(data.transitPref);

      const derived = {
        density: pd ?? 0.35,
        aqi:     aqiPref   ?? mood ?? 0.25,
        noise:   noisePref ?? mood ?? 0.15,
        rent:    rentPref  ?? mood ?? 0.15,
        transit: transitPref ?? mood ?? 0.10,
      };

      setWeights(normalizeWeights(derived));
    }, () => {
      setLoading(false);
      setWeights(DEFAULT_WEIGHTS);
    });

    return () => unsub && unsub();
  }, []);

  return { weights, loading };
}

function normalizeWeights(obj) {
  const w = { ...DEFAULT_WEIGHTS, ...obj };
  const sum = Object.values(w).reduce((a, b) => a + (Number(b) || 0), 0) || 1;
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, (Number(v) || 0) / sum]));
}

// map 1..10 slider → 0..1 (more weight = more frustration importance)
function num01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  // (1..10) → (0..1). Use ease curve so higher picks jump more.
  const t = (n - 1) / 9;           // linear 0..1
  return Math.pow(Math.max(0, Math.min(1, t)), 1.2); // slight emphasis curve
}
