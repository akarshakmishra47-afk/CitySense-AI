const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const https = require('https');
const fs = require('fs');
const mongoose = require('mongoose');

const args = process.argv.slice(2);
const command = args[0];

const GEOJSON_PATH = path.join(__dirname, '../public/data/up_districts.geojson');
const MASTER_LIST_PATH = path.join(__dirname, '../src/data/up_districts.json');

function downloadGeoJSON() {
    console.log('Downloading India geojson...');
    https.get('https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson', (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            try {
                console.log('Parsing JSON...');
                const data = JSON.parse(body);
                
                // Filter UP
                const upFeatures = data.features.filter(f => 
                    f.properties.NAME_1 === 'Uttar Pradesh'
                );
                
                console.log('Extracted features:', upFeatures.length);
                
                upFeatures.forEach(f => {
                    f.properties.district_name = f.properties.NAME_2;
                });
                
                data.features = upFeatures;
                fs.writeFileSync(GEOJSON_PATH, JSON.stringify(data));
                console.log('Saved to up_districts.geojson');
            } catch (e) {
                console.error('Error:', e.message);
            }
        });
    }).on('error', e => console.error(e));
}

function filterGeoJSON() {
    const geojsonData = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
    const masterList = JSON.parse(fs.readFileSync(MASTER_LIST_PATH, 'utf8'));
    
    const upDistricts = new Set(masterList.map(d => d.toLowerCase().replace(/[^a-z0-9]/g, '')));
    
    const manualMap = {
        'banares': 'varanasi',
        'benares': 'varanasi',
        'kheri': 'lakhimpurkheri',
        'muzaffarnagar': 'muzaffarnagar',
        'bulandshahr': 'bulandshahr',
        'saharanpur': 'saharanpur',
        'hardoi': 'hardoi',
        'lucknow': 'lucknow',
        'allahabad': 'prayagraj',
        'faizabad': 'ayodhya',
        'budaun': 'badaun',
        'kanshiraamnagar': 'kasganj',
        'mahrajganj': 'maharajganj',
        'ramabainagar': 'kasganj'
    };
    
    const filteredFeatures = geojsonData.features.filter(feature => {
        let rawName = feature.properties.district_name || feature.properties.NAME_2 || '';
        let norm = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (manualMap[norm]) {
            norm = manualMap[norm];
            feature.properties.district_name = masterList.find(d => d.toLowerCase().replace(/[^a-z0-9]/g, '') === norm) || rawName;
        } else {
            const found = masterList.find(d => d.toLowerCase().replace(/[^a-z0-9]/g, '') === norm);
            if (found) {
               feature.properties.district_name = found; 
            }
        }
        
        const keep = upDistricts.has(norm);
        if (!keep) {
            console.log('Removing:', rawName);
        }
        return keep;
    });
    
    geojsonData.features = filteredFeatures;
    fs.writeFileSync(GEOJSON_PATH, JSON.stringify(geojsonData));
    console.log('Filtered geojson. Remaining features:', filteredFeatures.length);
}

function normalizeGeoJSON() {
    const geoData = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
    
    const nameMap = {
        "Bara Banki": "Barabanki",
        "Allahabad": "Prayagraj",
        "Faizabad": "Ayodhya",
        "Jyotiba Phule Nagar": "Amroha",
        "Kanpur": "Kanpur Nagar",
        "Lakhimpur Kheri": "Kheri",
        "Rae Bareli": "Raebareli",
        "Sant Ravi Das Nagar": "Bhadohi",
        "Siddharth Nagar": "Siddharthnagar",
        "Mahamaya Nagar": "Hathras",
        "Kanshi Ram Nagar": "Kasganj",
        "Prabuddha Nagar": "Shamli",
        "Panchsheel Nagar": "Hapur"
    };
    
    geoData.features.forEach(f => {
        let oldName = f.properties.district_name;
        if (nameMap[oldName]) {
            f.properties.district_name = nameMap[oldName];
            console.log(`Renamed ${oldName} to ${nameMap[oldName]}`);
        }
    });
    
    fs.writeFileSync(GEOJSON_PATH, JSON.stringify(geoData));
    console.log('GeoJSON normalized!');
}

function getRoughCentroid(geometry) {
    let pts = 0;
    let sumLng = 0;
    let sumLat = 0;
    
    function extract(arr) {
        if (typeof arr[0] === 'number') {
            sumLng += arr[0];
            sumLat += arr[1];
            pts++;
        } else {
            for (let i = 0; i < arr.length; i++) {
                extract(arr[i]);
            }
        }
    }
    
    extract(geometry.coordinates);
    return { lat: sumLat / pts, lng: sumLng / pts };
}

async function fixCoordinates() {
    try {
        const ComplaintCluster = require('../src/models/ComplaintCluster');
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connected to DB.');
        
        const geoData = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
        
        const centroids = {};
        geoData.features.forEach(f => {
            centroids[f.properties.district_name] = getRoughCentroid(f.geometry);
        });
        
        const clusters = await ComplaintCluster.find({});
        console.log(`Found ${clusters.length} clusters. Updating coordinates...`);
        
        let updated = 0;
        for (const cluster of clusters) {
            const center = centroids[cluster.district];
            if (center) {
                // Add a small random offset (approx +- 3-5 km) so they don't perfectly overlap
                cluster.latitude = center.lat + (Math.random() - 0.5) * 0.1;
                cluster.longitude = center.lng + (Math.random() - 0.5) * 0.1;
                await cluster.save();
                updated++;
            }
        }
        
        console.log(`Successfully updated coordinates for ${updated} clusters!`);
    } catch(err) {
        console.error('Error fixing coordinates:', err);
    } finally {
        await mongoose.disconnect();
    }
}

function validateGeoJSON() {
    if (!fs.existsSync(GEOJSON_PATH)) {
        console.error('Error: GeoJSON file does not exist at', GEOJSON_PATH);
        process.exit(1);
    }
    let geoData, masterList;
    try {
        geoData = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
    } catch (e) {
        console.error('Error parsing GeoJSON:', e.message);
        process.exit(1);
    }
    
    try {
        masterList = JSON.parse(fs.readFileSync(MASTER_LIST_PATH, 'utf8'));
    } catch (e) {
        console.error('Error parsing master list:', e.message);
        process.exit(1);
    }

    if (geoData.type !== 'FeatureCollection' || !Array.isArray(geoData.features)) {
        console.error('Error: Invalid GeoJSON format. Must be a FeatureCollection.');
        process.exit(1);
    }

    let valid = true;
    let missingDistricts = new Set(masterList);
    let extraDistricts = [];

    geoData.features.forEach((feature, index) => {
        if (!feature.geometry || !feature.geometry.coordinates) {
            console.error(`Error: Feature at index ${index} is missing geometry coordinates.`);
            valid = false;
        }
        
        const dName = feature.properties.district_name;
        if (!dName) {
            console.error(`Error: Feature at index ${index} is missing district_name in properties.`);
            valid = false;
        } else {
            if (missingDistricts.has(dName)) {
                missingDistricts.delete(dName);
            } else if (!masterList.includes(dName)) {
                extraDistricts.push(dName);
            }
        }
    });

    if (missingDistricts.size > 0) {
        console.warn('Warning: The following districts from master list are missing in GeoJSON:', Array.from(missingDistricts));
    }
    
    if (extraDistricts.length > 0) {
        console.warn('Warning: The following districts in GeoJSON are not in the master list:', extraDistricts);
    }

    if (valid) {
        console.log('Validation successful! GeoJSON is well-formed and valid.');
    } else {
        console.error('Validation failed! GeoJSON contains errors.');
        process.exit(1);
    }
}

switch (command) {
    case 'fetch':
        downloadGeoJSON();
        break;
    case 'filter':
        filterGeoJSON();
        break;
    case 'normalize':
        normalizeGeoJSON();
        break;
    case 'fix-coords':
        fixCoordinates();
        break;
    case 'validate':
        validateGeoJSON();
        break;
    default:
        console.log(`
Usage: npm run manage-geojson <command>

Commands:
  fetch        Download the UP districts GeoJSON from remote source
  filter       Filter out districts not in the master list
  normalize    Normalize district names in the GeoJSON to match master list
  fix-coords   Update complaint cluster coordinates in the database using GeoJSON centroids
  validate     Validate the integrity of the UP districts GeoJSON
`);
        break;
}
