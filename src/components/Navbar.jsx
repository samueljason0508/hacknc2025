import { useState, useEffect } from 'react';

export default function Navbar({ data }) {
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data) return;

    const fetchAiOpinion = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/aiOnPrompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        });
        if (response.ok) {
          const result = await response.json();
          setAiResponse(result);
        } else {
          setAiResponse({ status: 'error', message: 'API unavailable' });
        }
      } catch (err) {
        console.error('Error calling AI API:', err);
        setAiResponse({ status: 'error', message: 'API connection failed' });
      } finally {
        setLoading(false);
      }
    };

    fetchAiOpinion();
  }, [data]);

  return (
    <div style={{ width: '20%', padding: '10px', overflowY: 'auto' }}>
      <h3>Navbar</h3>
      <hr />
      {data && (
        <>
          <div style={{ marginTop: '20px' }}>
            <h4>Map Data:</h4>
            <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4>Gemini Opinion:</h4>
            <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {loading ? 'Loading...' : aiResponse?.status === 'error' ? aiResponse.message : aiResponse?.data || 'No response yet'}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
