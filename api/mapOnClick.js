// Air Quality Service
async function getAirQuality(lat, lng) {
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

// Map Service
async function handleMapClick(lat, lng) {
    console.log('Lat:', lat, 'Lng:', lng);
    let result = {};

    result.airQuality = await getAirQuality(lat, lng);

    return result;
}

// Vercel serverless function handler
export default async function handler(request, response) {
  try {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return response.status(405).json({
        status: 'error',
        message: 'Method not allowed'
      });
    }

    const { lat, lng } = request.body;

    console.log('Raw request body:', request.body);
    console.log('Lat:', lat, 'Lng:', lng);

    const result = await handleMapClick(lat, lng);

    return response.status(200).json({
      status: 'ok',
      data: result
    });

  } catch (error) {
    console.error('Error in mapOnClickController:', error);
    return response.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}

