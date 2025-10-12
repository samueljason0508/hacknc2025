// src/utils/frustrationIndex.js

// Hard default weights (sum ≈ 1). You can override per user.
export const DEFAULT_WEIGHTS = {
  density: .8,  // population density (mean)
  aqi:     .2,  // air quality (pm2.5/aqi proxy later)
  noise:   0,  // environmental noise
  rent:    0,  // housing cost
  transit: 0,  // transit pain / lack of options
};

// clamp to 0..1
const clamp01 = (x) => Math.max(0, Math.min(1, x));
// 0..1  ->  -10..+10  (–10 pleasing → +10 frustrating)
export const toSigned = (f01) => Math.max(-10, Math.min(10, f01 * 20 - 10));

/** -------- Normalizers (convert raw to 0..1 = bad) --------
 * Tune these as you add real data.
 */
export function normDensity(meanPerKm2) {
  // Piecewise saturating: "≤1" is ~0 frustration; ≥3000 saturates to 1.
  if (meanPerKm2 == null) return 0.5;
  const m = Number(meanPerKm2) || 0;
  if (m <= 1) return 0.05;
  if (m <= 10) return 0.15;
  if (m <= 50) return 0.30;
  if (m <= 200) return 0.50;
  if (m <= 1000) return 0.75;
  if (m <= 2000) return 0.90;
  return 1.0; // ≥3000
}

export function normAQI(aqi) {
  // If you later pass pm2_5 instead of AQI, remap here.
  // Assuming "AQI-like" 0..300+ → 0..1 (bad). Below 50 good, >200 awful.
  if (aqi == null) return 0.5;
  const a = Number(aqi);
  if (!Number.isFinite(a)) return 0.5;
  if (a <= 50) return 0.1;
  if (a <= 100) return 0.3;
  if (a <= 150) return 0.6;
  if (a <= 200) return 0.8;
  return 1.0;
}

export function normNoiseDb(db) {
  // 40dB calm → 0; 85dB loud → 1
  if (!Number.isFinite(db)) return 0.5;
  const t = (db - 40) / (85 - 40);
  return clamp01(t);
}

export function normRent(usd) {
  // 600 → 0, 4000 → 1
  if (!Number.isFinite(usd)) return 0.5;
  const t = (usd - 600) / (4000 - 600);
  return clamp01(t);
}

export function normTransitPain(quality01Good) {
  // If you have a "goodness" score 0..1, convert to pain (bad).
  // 1.0 good → 0 bad; 0.0 good → 1 bad
  if (!Number.isFinite(quality01Good)) return 0.5;
  return clamp01(1 - quality01Good);
}

/**
 * Blend any subset of factors you have.
 * `raw` can include: { densityMean, aqi, noiseDb, rentUsd, transitGood01 }
 * `weights` is an object with keys matching DEFAULT_WEIGHTS.
 */
export function computeFrustration(raw = {}, weights = DEFAULT_WEIGHTS) {
  const parts = {
    density01: normDensity(raw.densityMean),
    aqi01:     normAQI(raw.aqi),
    noise01:   normNoiseDb(raw.noiseDb),
    rent01:    normRent(raw.rentUsd),
    transit01: normTransitPain(raw.transitGood01),
  };

  // Only blend factors present in weights; missing raw factors contribute 0.5 by default normalizers above
  const w = { ...DEFAULT_WEIGHTS, ...weights };

  // Weighted sum; ensure weights sum to 1
  const sumW = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const normW = Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v / sumW]));

  const score01 =
    (parts.density01 * (normW.density ?? 0)) +
    (parts.aqi01     * (normW.aqi     ?? 0)) +
    (parts.noise01   * (normW.noise   ?? 0)) +
    (parts.rent01    * (normW.rent    ?? 0)) +
    (parts.transit01 * (normW.transit ?? 0));

  return {
    score01: clamp01(score01),
    scoreSigned: toSigned(score01),
    parts,
    weights: normW,
  };
}

// Color ramp for signed score (–10 → +10)
export function colorForSigned(s = 0) {
  if (s <= -3) return '#2DC937'; // deep green
  if (s <= -2) return '#7DCB3A';
  if (s <   0) return '#C9D73A';
  if (s <   2) return '#E7B416';
  if (s <   3) return '#DB7B2B';
  return '#CC3232';
}
