const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/datameet/maps/master/Districts/Census_2011/2011_Dist.geojson';
const outputPath = 'c:\\Users\\LENOVO\\Desktop\\CivicPulse AI\\public\\data\\up_districts.geojson';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const geojson = JSON.parse(data);
      // Filter for UP
      geojson.features = geojson.features.filter(f => f.properties.ST_NM === 'Uttar Pradesh');
      fs.writeFileSync(outputPath, JSON.stringify(geojson));
      console.log('Successfully saved UP geojson with ' + geojson.features.length + ' features.');
    } catch(e) {
      console.error('Error parsing:', e);
    }
  });
}).on('error', (e) => {
  console.error(e);
});
