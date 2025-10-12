export async function getLocationDetails(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MyApp/1.0 (your@email.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`Location API error: ${response.status}`);
  }

  const result = await response.json();
  return result;
}

// Test
// getLocationDetails(37.419734, -122.0827784)
//   .then((data) => {
//     console.log(JSON.stringify(data, null, 2));
//   })
//   .catch((err) => {
//     console.error('Error:', err.message);
//   });
