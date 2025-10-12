import { getAirQuality } from './airQualityService.js';

import { getLocationDetails } from './locationDetailsService.js';  

import { getPopulationDensity } from './populationService.js';

export async function handleMapClick(lat, lng) {
    console.log('Lat:', lat, 'Lng:', lng);
    let result = {};

    result.airQuality = await getAirQuality(lat, lng);
    
    result.locationDetails = await getLocationDetails(lat, lng);

    result.populationDensity = await getPopulationDensity(lat, lng);
    console.log('Population Density Data:', JSON.stringify(result.populationDensity, null, 2));

    console.log('Complete Result:', JSON.stringify(result, null, 2));

    return result;
}

