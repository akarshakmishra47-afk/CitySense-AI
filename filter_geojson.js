const fs = require('fs');
const path = require('path');

const geojsonPath = path.join(__dirname, 'public/data/up_districts.geojson');
const masterListPath = path.join(__dirname, 'src/data/up_districts.json');

const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
const masterList = JSON.parse(fs.readFileSync(masterListPath, 'utf8'));

// Create a Set of normalized UP district names
const upDistricts = new Set(masterList.map(d => d.toLowerCase().replace(/[^a-z0-9]/g, '')));

// Special mappings if names differ slightly between geojson and master list
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
    
    // Apply manual map if exists
    if (manualMap[norm]) {
        norm = manualMap[norm];
        feature.properties.district_name = masterList.find(d => d.toLowerCase().replace(/[^a-z0-9]/g, '') === norm) || rawName;
    } else {
        const found = masterList.find(d => d.toLowerCase().replace(/[^a-z0-9]/g, '') === norm);
        if (found) {
           feature.properties.district_name = found; 
        }
    }
    
    // Keep it if it's in the master list OR if it's explicitly mapped
    const keep = upDistricts.has(norm);
    if (!keep) {
        console.log('Removing:', rawName);
    }
    return keep;
});

geojsonData.features = filteredFeatures;

fs.writeFileSync(geojsonPath, JSON.stringify(geojsonData));
console.log('Filtered geojson. Remaining features:', filteredFeatures.length);
