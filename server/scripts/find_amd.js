const mongoose = require('mongoose');
require('dotenv').config();

async function findAmdRoute() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const route = await mongoose.connection.db.collection('routes').findOne({ routeNumber: /AMD/i });
        if (route) {
            console.log('Found AMD Route:', route.routeNumber, route._id);
        } else {
            const all = await mongoose.connection.db.collection('routes').find({}).toArray();
            console.log('All Route Numbers:', all.map(r => r.routeNumber));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findAmdRoute();
