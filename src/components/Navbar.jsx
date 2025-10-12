export default function Navbar({ data }) {
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
              STUFF
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
