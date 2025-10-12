import { useState, useEffect, useMemo } from 'react';
import { computeFrustration, colorForSigned } from '../utils/frustrationIndex';
import { useUserWeights } from '../services/userWeights';

const escapeHtml = (s='') => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmt = (v,d=2) => Number.isFinite(Number(v)) ? Number(v).toFixed(d) : '—';

function renderAiText(str){
  if(!str) return '—';
  let t = escapeHtml(String(str));
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|\n)(\s*)([A-Z][A-Za-z0-9 \-_/]{1,40}):/g, (_m,a,ws,label)=>`${a}${ws}<strong>${label}:</strong>`);
  t = t.replace(/\n/g,'<br/>');
  return t;
}

function Row({ title, open, onClick }) {
  return (
    <button className="nb-row" onClick={onClick} type="button" aria-expanded={open}>
      <span>{title}</span>
      <span className={`nb-chevron ${open ? 'nb-chevron-open' : ''}`}>›</span>
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="nb-section">
      <div className="nb-section-title">{title}</div>
      <div className="nb-section-body">{children}</div>
    </div>
  );
}

// ⬇️ accept collapsed/onToggle as PROPS
export default function Navbar({ data, collapsed, onToggle }) {
  const [openAQ, setOpenAQ] = useState(false);
  const [openLoc, setOpenLoc] = useState(false);
  const [openGrocery, setOpenGrocery] = useState(false);
  const [openSummary, setOpenSummary] = useState(false);

  const { weights } = useUserWeights();
  const payload = data?.data ?? data ?? null;

  const address = useMemo(() => {
    const loc = payload?.locationDetails || {};
    // Handle formatted_address or display_name
    if (loc.formatted_address) return loc.formatted_address;
    if (loc.display_name) return loc.display_name;
    
    // Fallback: construct from address object (OpenStreetMap format)
    const addr = loc.address || {};
    const parts = [
      addr.road || loc.street,
      addr.city || addr.county,
      addr.state,
      addr.country || loc.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Click the map';
  }, [payload]);

  const scoreObj = useMemo(() => {
    if (!payload) return null;  

    const densityMean =
      payload?.populationDensity?.mean ??
      payload?.populationDensity?.value ??
      payload?.populationDensity;

    const pm25 =
      payload?.airQuality?.pm2_5 ??
      payload?.airQuality?.pm25 ??
      payload?.airQuality?.pm2_5_avg;

    const { scoreSigned, score01, parts, weights: used } = computeFrustration(
      { densityMean, aqi: pm25 },
      weights
    );
    return {
      scoreSigned,
      score01,
      parts,
      usedWeights: used,
      densityMean: Number(densityMean),
      pm25: Number(pm25),
    };
  }, [payload, weights]);

  const badge = (() => {
    const val = scoreObj?.scoreSigned;
    const display = Number.isFinite(val) ? (val > 0 ? `+${fmt(val, 2)}` : fmt(val, 2)) : '…';
    const bg = Number.isFinite(val) ? colorForSigned(val) : '#555';
    return { txt: display, bg, val };
  })();

  // AI opinion
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!data) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/aiOnPrompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        });
        if (res.ok) setAiResponse(await res.json());
        else setAiResponse({ status: 'error', message: 'API unavailable' });
      } catch {
        setAiResponse({ status: 'error', message: 'API connection failed' });
      } finally {
        setLoading(false);
      }
    })();
  }, [data]);

  const aiText =
    aiResponse?.status === 'error'
      ? aiResponse.message
      : aiResponse?.data || 'Click the map to get an opinion';

  return (
    <aside className={`nb-wrap nb-font ${collapsed ? 'nb-collapsed' : ''}`}>
      <button
        className="nb-toggle"
        type="button"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={() => onToggle(!collapsed)}
      >
        {collapsed ? '«' : '»'}
      </button>

      <div
        className="nb-mini-pill"
        style={{ backgroundColor: badge.bg }}
        title="Frustration index (–10 pleasing → +10 frustrating)"
      >
        {badge.txt}
      </div>

      <h1 className="nb-title">Why not here?</h1>

      <div className="nb-card">
        <Section title="AI Opinion">
          <div
            className="nb-ai"
            dangerouslySetInnerHTML={{
              __html: loading ? 'Thinking…' : renderAiText(aiText),
            }}
          />
        </Section>

        {/* Summary (collapsible) */}
        <Row title="Summary" open={openSummary} onClick={() => setOpenSummary(v => !v)} />
        {openSummary && (
          <div className="nb-disclosure">
            <div className="nb-kv">
              <span>Address</span>
              <span className="nb-mono" title={address}>
                {address}
              </span>
            </div>
            <div className="nb-kv">
              <span>Frustration Index</span>
              <span
                className="nb-mono"
                style={{ 
                  backgroundColor: badge.bg, 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  color: 'white'
                }}
                title={`Frustration index: ${fmt(badge.val, 2)}`}
              >
                {badge.txt}
              </span>
            </div>
            <div className="nb-kv">
              <span>Place ID</span>
              <span className="nb-mono">
                {payload?.locationDetails?.place_id || '—'}
              </span>
            </div>
            <div className="nb-kv">
              <span>Coordinates</span>
              <span className="nb-mono">
                {payload?.locationDetails?.lat && payload?.locationDetails?.lon
                  ? `${fmt(payload.locationDetails.lat, 6)}, ${fmt(payload.locationDetails.lon, 6)}`
                  : '—'}
              </span>
            </div>
          </div>
        )}

        {/* Air Quality (collapsible) */}
        <Row title="Air Quality" open={openAQ} onClick={() => setOpenAQ(v => !v)} />
        {openAQ && (
          <div className="nb-disclosure">
            <div className="nb-kv">
              <span>PM2.5</span>
              <span className="nb-mono">
                {fmt(scoreObj?.pm25, 2)} <span className="nb-mono">μg/m³</span>
              </span>
            </div>
            <div className="nb-kv">
              <span>Weight</span>
              <span className="nb-mono">
                {fmt(scoreObj?.usedWeights?.aqi ?? 0, 2)}
              </span>
            </div>
          </div>
        )}

        {/* Location (collapsible) */}
        <Row title="Location" open={openLoc} onClick={() => setOpenLoc(v => !v)} />
        {openLoc && (
          <div className="nb-disclosure">
            <div className="nb-kv">
              <span>Pop. density (mean)</span>
              <span className="nb-mono">
                {fmt(scoreObj?.densityMean, 2)} /km²
              </span>
            </div>
            <div className="nb-kv">
              <span>Weight</span>
              <span className="nb-mono">
                {fmt(scoreObj?.usedWeights?.density ?? 0, 2)}
              </span>
            </div>
          </div>
        )}

        {/* Grocery Store (collapsible) */}
        <Row title="Nearest Grocery Store" open={openGrocery} onClick={() => setOpenGrocery(v => !v)} />
        {openGrocery && (
          <div className="nb-disclosure">
            {payload?.getDistanceToNearestGrocery ? (
              <>
                <div className="nb-kv">
                  <span>Store</span>
                  <span className="nb-mono">
                    {payload.getDistanceToNearestGrocery.storeName || '—'}
                  </span>
                </div>
                <div className="nb-kv">
                  <span>Address</span>
                  <span className="nb-mono">
                    {payload.getDistanceToNearestGrocery.address || '—'}
                  </span>
                </div>
                <div className="nb-kv">
                  <span>Distance</span>
                  <span className="nb-mono">
                    {payload.getDistanceToNearestGrocery.distance_text || '—'}
                  </span>
                </div>
                <div className="nb-kv">
                  <span>Drive time</span>
                  <span className="nb-mono">
                    {payload.getDistanceToNearestGrocery.duration_text || '—'}
                  </span>
                </div>
              </>
            ) : (
              <div className="nb-kv">
                <span>No data available</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
