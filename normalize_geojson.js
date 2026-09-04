const fs = require('fs');
const geoData = JSON.parse(fs.readFileSync('public/data/up_districts.geojson', 'utf8'));

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

fs.writeFileSync('public/data/up_districts.geojson', JSON.stringify(geoData));
console.log('GeoJSON normalized!');
