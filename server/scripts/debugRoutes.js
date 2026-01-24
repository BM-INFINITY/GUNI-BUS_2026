const mongoose = require('mongoose');
const Route = require('../models/Route');
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

async function debugRoutes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const routes = await Route.find({}).limit(3);

        console.log('=== SAMPLE ROUTES (First 3) ===');
        routes.forEach(r => {
            console.log('\nRoute Object:');
            console.log('  _id:', r._id);
            console.log('  routeNumber:', r.routeNumber, '(type:', typeof r.routeNumber, ')');
            console.log('  routeName:', r.routeName);
            console.log('  ticketPrices:', r.ticketPrices);
        });

        console.log('\n=== TESTING QUERY ===');
        const testRoute = await Route.findOne({ routeNumber: "1" });
        console.log('Query { routeNumber: "1" } found:', testRoute ? 'YES' : 'NO');

        if (!testRoute) {
            const testRoute2 = await Route.findOne({ routeNumber: 1 });
            console.log('Query { routeNumber: 1 } found:', testRoute2 ? 'YES' : 'NO');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

debugRoutes();
