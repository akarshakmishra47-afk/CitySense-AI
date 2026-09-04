const https = require('https');
const fs = require('fs');

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
            
            // normalize property name for our admin.js
            upFeatures.forEach(f => {
                f.properties.district_name = f.properties.NAME_2;
            });
            
            data.features = upFeatures;
            fs.writeFileSync('public/data/up_districts.geojson', JSON.stringify(data));
            console.log('Saved to up_districts.geojson');
            
        } catch (e) {
            console.error('Error:', e.message);
        }
    });
}).on('error', e => console.error(e));
