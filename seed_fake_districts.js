require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const ComplaintCluster = require('./src/models/ComplaintCluster');

async function seed() {
    await mongoose.connect(process.env.DATABASE_URL);
    
    const districts = JSON.parse(fs.readFileSync('./src/data/up_districts.json'));
    const geojsonData = JSON.parse(fs.readFileSync('./public/data/up_districts.geojson'));
    
    function getDistrictCenter(districtName) {
        const feature = geojsonData.features.find(f => f.properties.district_name === districtName);
        if (!feature) return { lat: 26.8, lng: 80.9 };
        
        let pts = [];
        const extractPoints = (arr) => {
            if (!Array.isArray(arr)) return;
            if (arr.length === 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
                pts.push(arr);
            } else {
                arr.forEach(extractPoints);
            }
        };
        extractPoints(feature.geometry.coordinates);
        
        if (pts.length > 0) {
            let latSum = 0, lngSum = 0;
            pts.forEach(p => { lngSum += p[0]; latSum += p[1]; });
            return { lat: latSum / pts.length, lng: lngSum / pts.length };
        }
        return { lat: 26.8, lng: 80.9 };
    }
    
    const categories = ['Water Supply', 'Roads & Transport', 'Sanitation', 'Street Lighting', 'Public Health'];
    const statuses = ['investigating', 'assigned', 'in_progress', 'escalated', 'resolved', 'resolved', 'resolved'];
    const issues = {
        'Water Supply': ['Severe Waterlogging', 'Contaminated Drinking Water', 'Pipeline Burst'],
        'Roads & Transport': ['Deep Potholes on Main Arterial', 'Traffic Light Malfunction', 'Bridge Structural Damage'],
        'Sanitation': ['Garbage Overflow in Public Area', 'Drainage Blockage', 'Illegal Dumping'],
        'Street Lighting': ['Complete Blackout in Sector', 'Flickering Lights', 'Exposed Wiring'],
        'Public Health': ['Mosquito Breeding Ground', 'Stray Animal Menace', 'Illegal Slaughterhouse']
    };

    console.log('Clearing existing data...');
    await ComplaintCluster.deleteMany({});

    console.log('Seeding districts with 1-5 clusters...');
    for (const district of districts) {
        // Generate between 1 and 5 clusters
        const numClusters = Math.floor(Math.random() * 5) + 1;
        console.log(`Seeding ${numClusters} clusters for ${district}...`);
        
        const center = getDistrictCenter(district);
            
        for (let i = 0; i < numClusters; i++) {
                const category = categories[Math.floor(Math.random() * categories.length)];
                const titleChoices = issues[category];
                const title = titleChoices[Math.floor(Math.random() * titleChoices.length)] + ' in ' + district;
                
                await ComplaintCluster.create({
                    title,
                    category,
                    state: 'Uttar Pradesh',
                    district: district,
                    localBodyType: 'Nagar Nigam',
                    municipalCorp: district,
                    priorityScore: Math.floor(Math.random() * 60) + 40,
                    severityScore: Math.floor(Math.random() * 60) + 40,
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    latitude: center.lat + (Math.random() - 0.5) * 0.1,
                    longitude: center.lng + (Math.random() - 0.5) * 0.1,
                    estimatedAffectedPeople: Math.floor(Math.random() * 5000) + 100,
                    probableRootCause: `Potential infrastructure failure relating to ${category.toLowerCase()}.`,
                    recommendedAction: `Deploy maintenance team to assess ${category.toLowerCase()} infrastructure.`,
                    rootCauseConfidence: Math.floor(Math.random() * 30) + 65,
                    complaints: [
                        {
                            _id: new mongoose.Types.ObjectId(),
                            category: category,
                            description: `Citizen reported issue regarding ${title.toLowerCase()}. Immediate attention required.`,
                            severity: Math.floor(Math.random() * 60) + 40,
                            ward: 'Ward ' + (Math.floor(Math.random() * 50) + 1),
                            urgency: 'High',
                            durationDays: Math.floor(Math.random() * 10) + 1,
                            createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
                        }
                    ]
                });
            }
    }
    
    console.log('Seeding complete!');
    mongoose.disconnect();
}

seed().catch(console.error);
