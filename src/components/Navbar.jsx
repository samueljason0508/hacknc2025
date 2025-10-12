import { useMemo, useState, useEffect } from 'react';
import { computeFrustration, colorForSigned } from '../utils/frustrationIndex';
import { useUserWeights } from '../services/userWeights';

/** Escape HTML to avoid injection */
const escapeHtml = (s = '') =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** 
 * Format AI text:
 *  - Bold markdown **like this**
 *  - Bold "Lead Words:" at the start of a line (Pros:, Cons:, Summary:, Air Quality:, etc.)
 *  - Preserve newlines
 */
function renderAiText(str) {
  if (!str) return '—';
  let t = escapeHtml(String(str));

  // Bold markdown **text**
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Bold leading label words ending with ":" at the start of each line
  t = t.replace(
    /(^|\n)(\s*)([A-Z][A-Za-z0-9 \-_/]{1,40}):/g,
    (_m, a, ws, label) => `${a}${ws}<strong>${label}:</strong>`
  );

  // Convert newlines to <br>
  t = t.replace(/\n/g, '<br/>');

  return t;
}

function Row({ title, onClick }) {
  return (
    <button className="nb-row" onClick={onClick} type="button">
      <span>{title}</span>
      <span className="nb-chevron">›</span>
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

export default function Navbar({ data }) {
  const { weights } = useUserWeights();
  const payload = data?.data ?? data ?? null;

  const address = useMemo(() => {
    const loc = payload?.locationDetails || {};
    return (
      loc.formatted_address ||
      loc.display_name ||
      [loc.street, loc.city, loc.state, loc.country].filter(Boolean).join(', ') ||
      'Click the map'
    );
  }, [payload]);

  const scoreObj = useMemo(() => {
    if (!payload) return null;
    const densityMean =
      payload.populationDensity?.mean ??
      payload.populationDensity?.value ??
      payload.populationDensity;

    const pm25 =
      payload.airQuality?.pm2_5 ??
      payload.airQuality?.pm25 ??
      payload.airQuality?.pm2_5_avg;

    const { scoreSigned, score01, parts, weights: used } = computeFrustration(
      { densityMean, aqi: pm25 },
      weights
    );
    return { scoreSigned, score01, parts, usedWeights: used, densityMean, pm25 };
  }, [payload, weights]);

  const [openAQ, setOpenAQ] = useState(false);
  const [openLoc, setOpenLoc] = useState(false);

  const badge = (() => {
    const val = scoreObj?.scoreSigned;
    const txt =
      typeof val === 'number' && Number.isFinite(val)
        ? (val > 0 ? `+${val.toFixed(0)}` : `${val.toFixed(0)}`)
        : '…';
    const bg = typeof val === 'number' ? colorForSigned(val) : '#555';
    return { txt, bg };
  })();

  // AI response (first)
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
        if (res.ok) {
          setAiResponse(await res.json());
        } else {
          setAiResponse({ status: 'error', message: 'API unavailable' });
        }
      } catch (e) {
        console.error(e);
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
    <aside className="nb-wrap nb-font">
      <h1 className="nb-title">Why not here?</h1>

      <div className="nb-card">
        {/* AI Opinion first */}
        <Section title="AI Opinion">
          <div
            className="nb-ai"
            dangerouslySetInnerHTML={{
              __html: loading ? 'Thinking…' : renderAiText(aiText),
            }}
          />
        </Section>

        {/* Summary */}
        <Section title="Summary">
          <div className="nb-summary">
            <div className="nb-address" title={address}>
              {address}
            </div>
            <div
              className="nb-score-pill"
              style={{ backgroundColor: badge.bg }}
              title="Frustration index (–10 pleasing → +10 frustrating)"
            >
              {badge.txt}
            </div>
          </div>
        </Section>

        {/* Air Quality */}
        <Row title="Air Quality" onClick={() => setOpenAQ((s) => !s)} />
        {openAQ && (
          <div className="nb-disclosure">
            <div className="nb-kv">
              <span>PM2.5</span>
              <span className="nb-mono">
                {scoreObj?.pm25 ?? '—'} <span className="nb-mono">μg/m³</span>
              </span>
            </div>
            <div className="nb-kv">
              <span>Weight</span>
              <span className="nb-mono">
                {(scoreObj?.usedWeights?.aqi ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Location */}
        <Row title="Location" onClick={() => setOpenLoc((s) => !s)} />
        {openLoc && (
          <div className="nb-disclosure">
            <div className="nb-kv">
              <span>Pop. density (mean)</span>
              <span className="nb-mono">
                {scoreObj?.densityMean ?? '—'} /km²
              </span>
            </div>
            <div className="nb-kv">
              <span>Weight</span>
              <span className="nb-mono">
                {(scoreObj?.usedWeights?.density ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
