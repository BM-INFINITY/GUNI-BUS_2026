const mongoose = require('mongoose');
const Route = require('../models/Route');
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

async function listAllRoutes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const routes = await Route.find({}, 'routeNumber routeName').sort({ routeName: 1 });

        console.log('=== ALL ROUTES ===');
        routes.forEach((r, index) => {
            console.log(`${index + 1}. ${r.routeName.padEnd(20)} - ${r.routeNumber}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listAllRoutes();
