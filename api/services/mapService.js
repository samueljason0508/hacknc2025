import { getAirQuality } from './airQualityService.js';

import { getLocationDetails } from './locationDetailsService.js';  

export async function handleMapClick(lat, lng) {
    console.log('Lat:', lat, 'Lng:', lng);
    let result = {};

    result.airQuality = await getAirQuality(lat, lng);
    
    result.locationDetails = await getLocationDetails(lat, lng);

    return result;
}

