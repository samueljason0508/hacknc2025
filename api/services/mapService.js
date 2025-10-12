import { getAirQuality } from './airQualityService.js';
import { getLocationDetails } from './locationDetailsService.js';  
import { getPopulationDensity } from './populationService.js';
import { generateContent } from './geminiResponse.js';

export async function handleMapClick(lat, lng) {
  let result = {};

  result.airQuality = await getAirQuality(lat, lng);
  result.locationDetails = await getLocationDetails(lat, lng);
  result.populationDensity = await getPopulationDensity(lat, lng);

  if (result.populationDensity?.message === "Location not found in dataset") {
    return "No data found";
  }

  const prompt = `Analyze this location data and provide insights about the area's livability, air quality, and population density. Be concise and informative: ${JSON.stringify(result, null, 2)}`;

  result.geminiResponse = await generateContent(prompt);

  return result;
}
