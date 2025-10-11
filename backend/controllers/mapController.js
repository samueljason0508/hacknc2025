import { handleMapClick } from '../services/mapService.js';

export function mapOnClickController(req, res) {
  try {
    const { lat, lng, containerPoint, layerPoint, type } = req.body;

    console.log('Raw request body:', req.body);
    console.log('Received map click from frontend:');
    console.log('Lat:', lat, 'Lng:', lng);
    console.log('Container point:', containerPoint);
    console.log('Layer point:', layerPoint);
    console.log('Type:', type);

    const result = handleMapClick(lat, lng);

    res.status(200).json({
      status: 'ok',
      data: result
    });

  } catch (error) {
    console.error('Error in mapOnClickController:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}