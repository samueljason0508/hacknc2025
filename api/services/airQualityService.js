export async function getAirQuality(lat, lng) {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const startDate = oneMonthAgo.toISOString().split('T')[0];

    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=pm2_5,pm10,dust&start_date=${startDate}&end_date=${endDate}&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Air Quality API error: ${response.status}`);
    }

    const data = await response.json();

    const result = {
        pm2_5: calculateAverage(data.hourly.pm2_5),
        pm10: calculateAverage(data.hourly.pm10),
        dust: calculateAverage(data.hourly.dust)
    };

    return result;
}

function calculateAverage(values) {
    if (!Array.isArray(values) || values.length === 0) {
        return null;
    }
    let total = 0;
    for (let i = 0; i < values.length; i++) {
      total = total + values[i];
    }
    const sum = total;

    return sum / values.length;
}

// getAverageAirQuality(37.419734, -122.0827784)
//   .then((data) => {
//     console.log('Air Quality Data:\n', JSON.stringify(data, null, 2));
//   })
//   .catch((err) => {
//     console.error('Error:', err.message);
//   });
