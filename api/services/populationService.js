import fs from 'fs';
import path from 'path';

// Cache the GeoJSON data to avoid reading file repeatedly
let cachedGeoJSON = null;

// Point-in-polygon check using ray-casting algorithm
function pointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}

// Check if point is in a polygon or multipolygon geometry
function pointInGeometry(point, geometry) {
    if (geometry.type === 'Polygon') {
        // Check exterior ring
        return pointInPolygon(point, geometry.coordinates[0]);
    } else if (geometry.type === 'MultiPolygon') {
        // Check each polygon
        return geometry.coordinates.some(polygon => 
            pointInPolygon(point, polygon[0])
        );
    }
    return false;
}

export async function getPopulationDensity(lat, lng) {
    try {
        // Load GeoJSON if not cached
        if (!cachedGeoJSON) {
            const geoJSONPath = path.join(process.cwd(), 'public', 'voronoi_conus.geojson');
            const fileContents = fs.readFileSync(geoJSONPath, 'utf8');
            cachedGeoJSON = JSON.parse(fileContents);
        }
        
        // Find the feature containing this point
        const point = [lng, lat]; // GeoJSON uses [lng, lat] order
        const feature = cachedGeoJSON.features.find(f => 
            pointInGeometry(point, f.geometry)
        );
        
        if (feature && feature.properties) {
            const p = feature.properties;
            return {
                mean: p.mean ?? null,
                median: p.median ?? null,
                min: p.min ?? null,
                max: p.max ?? null,
                area_km2: p.area_km2 ?? null,
                pop_est: p.pop_est ?? null
            };
        }
        
        // Point not found in any polygon
        return {
            mean: null,
            median: null,
            min: null,
            max: null,
            area_km2: null,
            pop_est: null,
            message: 'Location not found in dataset'
        };
        
    } catch (error) {
        return {
            mean: null,
            median: null,
            min: null,
            max: null,
            area_km2: null,
            pop_est: null,
            error: 'Failed to fetch population data'
        };
    }
}


