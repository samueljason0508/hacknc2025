import { getAirQuality } from './airQualityService.js';

export async function handleMapClick(lat, lng) {

  console.log('Lat:', lat, 'Lng:', lng);
  let result = {};

  result.airQuality = await getAirQuality(lat, lng);

  return result;
}
