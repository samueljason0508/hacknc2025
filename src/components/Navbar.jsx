export default function Navbar({ data }) {
  return (
    <div style={{ width: '20%', padding: '10px', overflowY: 'auto' }}>
      <h3>Navbar</h3>
      <hr/>
      <nav>
        <div style={{ cursor: 'pointer' }} onClick={handleClick}>FUCK</div>
        <hr />
        <div style={{ cursor: 'pointer' }} onClick={handleClick}>THIS</div>
        <hr />
        <div style={{ cursor: 'pointer' }} onClick={handleClick}>SHIT</div>
        <hr />
      </nav>
      {data && (
        <div style={{ marginTop: '20px' }}>
          <h4>Map Data:</h4>
          <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function handleClick() {
  console.log('FUCK');
}
