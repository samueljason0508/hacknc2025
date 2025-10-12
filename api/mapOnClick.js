import { handleMapClick } from './services/mapService.js';

export default async function handler(request, response) {
  try {
    if (request.method !== 'POST') {
      return response.status(405).json({
        status: 'error',
        message: 'Method not allowed'
      });
    }

    const { lat, lng } = request.body;

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

