import { generateContent } from './services/geminiResponse.js';

export default async function handler(request, response) {
  try {
    if (request.method !== 'POST') {
      return response.status(405).json({
        status: 'error',
        message: 'Method not allowed'
      });
    }

    const { data } = request.body;
    const prompt = `Analyze this location data and provide insights about the area's livability, air quality, and population density. Be concise and informative:\n\n${JSON.stringify(data, null, 2)}`;

    const result = await generateContent(prompt);

    return response.status(200).json({
      status: 'ok',
      data: result
    });

  } catch (error) {
    console.error('Error in Loading Gemini:', error);
    return response.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}

