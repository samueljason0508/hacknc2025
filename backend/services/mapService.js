import { getAirQuality } from './airQualityService.js';

export function handleMapClick(lat, lng) {

  console.log('Lat:', lat, 'Lng:', lng);
  let result = {};

  result.airQuality = getAverageAirQuality(lat, long);

  return true;
}
