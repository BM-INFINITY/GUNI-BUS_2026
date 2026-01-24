const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Route = require('../models/Route');

dotenv.config({ path: '../.env' });

const listRoutes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/guni-bus');
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('--- COLLECTIONS IN DB ---');
        collections.forEach(c => console.log(c.name));
        console.log('-------------------------');

        const routes = await Route.find({}, 'routeNumber routeName ticketPrices');
        console.log('--- EXISTING ROUTES IN DB ---');
        routes.forEach(r => {
            console.log(`Number: "${r.routeNumber}", Name: "${r.routeName}", Prices: ${r.ticketPrices ? `Single: ₹${r.ticketPrices.single}, Round: ₹${r.ticketPrices.round}` : 'NOT SET'}`);
        });
        console.log('-----------------------------');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listRoutes();
