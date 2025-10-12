import { handleMapClick } from '../services/mapService.js';

export async function mapOnClickController(req, res) {
  try {
    const { lat, lng } = req.body;

    const result = await handleMapClick(lat, lng);

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