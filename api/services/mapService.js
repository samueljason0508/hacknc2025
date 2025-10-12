import { getAirQuality } from './airQualityService.js';

import { getLocationDetails } from './locationDetailsService.js';  

import { getPopulationDensity } from './populationService.js';

export async function handleMapClick(lat, lng) {
    console.log('Lat:', lat, 'Lng:', lng);
    let result = {};

    result.airQuality = await getAirQuality(lat, lng);
    
    result.locationDetails = await getLocationDetails(lat, lng);

    result.populationDensity = await getPopulationDensity(lat, lng);
    
    if (result.populationDensity?.message === "Location not found in dataset") {
        return "No data found";
    }

    return result;
}

