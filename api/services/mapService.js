import { getAirQuality } from './airQualityService.js';
import { getLocationDetails } from './locationDetailsService.js';  
import { getPopulationDensity } from './populationService.js';
import { generateContent } from './geminiResponse.js';

import { getDistanceToNearestGrocery } from './distanceFromGroceryStore.js';

// import { getUvIndex } from './get.js';



export async function handleMapClick(lat, lng) {
  let result = {};

  result.airQuality = await getAirQuality(lat, lng);
  result.locationDetails = await getLocationDetails(lat, lng);
  result.populationDensity = await getPopulationDensity(lat, lng);

  result.getDistanceToNearestGrocery = await getDistanceToNearestGrocery(lat, lng);
 
  if (result.populationDensity?.message === "Location not found in dataset") {
    return "No data found";
  }
  console.log(JSON.stringify(result, null, 2));


  return result;
}
