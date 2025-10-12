export default function Navbar() {
  return (
    <div style={{ width: '20%' }}>
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
    </div>
  );
}

function handleClick() {
  console.log('FUCK');
}
