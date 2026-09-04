require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const ComplaintCluster = require('./src/models/ComplaintCluster');

async function seed() {
    await mongoose.connect(process.env.DATABASE_URL);
    
    const districts = JSON.parse(fs.readFileSync('./src/data/up_districts.json'));
    
    const categories = ['Water Supply', 'Roads & Transport', 'Sanitation', 'Street Lighting', 'Public Health'];
    const statuses = ['investigating', 'assigned', 'in_progress', 'escalated'];
    const issues = {
        'Water Supply': ['Severe Waterlogging', 'Contaminated Drinking Water', 'Pipeline Burst'],
        'Roads & Transport': ['Deep Potholes on Main Arterial', 'Traffic Light Malfunction', 'Bridge Structural Damage'],
        'Sanitation': ['Garbage Overflow in Public Area', 'Drainage Blockage', 'Illegal Dumping'],
        'Street Lighting': ['Complete Blackout in Sector', 'Flickering Lights', 'Exposed Wiring'],
        'Public Health': ['Mosquito Breeding Ground', 'Stray Animal Menace', 'Illegal Slaughterhouse']
    };

    console.log('Checking districts...');
    for (const district of districts) {
        const count = await ComplaintCluster.countDocuments({ district: district });
        if (count === 0) {
            // Generate between 1 and 10 clusters
            const numClusters = Math.floor(Math.random() * 10) + 1;
            console.log(`Seeding ${numClusters} clusters for ${district}...`);
            
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
                    latitude: 26.8 + (Math.random() - 0.5) * 4,
                    longitude: 80.9 + (Math.random() - 0.5) * 4,
                    estimatedAffectedPeople: Math.floor(Math.random() * 5000) + 100
                });
            }
        }
    }
    
    console.log('Seeding complete!');
    mongoose.disconnect();
}

seed().catch(console.error);
