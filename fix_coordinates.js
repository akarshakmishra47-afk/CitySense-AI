require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const ComplaintCluster = require('./src/models/ComplaintCluster');

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

async function fix() {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to DB.');
    
    const geoData = JSON.parse(fs.readFileSync('./public/data/up_districts.geojson', 'utf8'));
    
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
    mongoose.disconnect();
}

fix().catch(console.error);
