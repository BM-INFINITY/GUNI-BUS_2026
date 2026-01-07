const mongoose = require('mongoose');
require('dotenv').config();

const Route = require('./models/Route');

const updateRoutePrices = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Set different prices for different routes based on distance
        const pricingMap = {
            'AMD-01': 12000,  // Ahmedabad (nearby)
            'GNR-01': 13000,  // Gandhinagar
            'MSN-01': 15000,  // Mehsana
            'HMT-01': 16000,  // Himatnagar
            'VJP-01': 14000,  // Vijapur
            'PTN-01': 17000,  // Patan
            'UNJ-01': 15000,  // Unjha
            'SDP-01': 16000,  // Sidhpur
            'PLN-01': 18000,  // Palanpur (farther)
            'IDR-01': 17000,  // Idar
            'KDI-01': 13000,  // Kadi
            'KLL-01': 14000   // Kalol
        };

        for (const [routeNumber, price] of Object.entries(pricingMap)) {
            await Route.updateOne(
                { routeNumber },
                { $set: { semesterCharge: price } }
            );
            console.log(`✅ ${routeNumber}: ₹${price}`);
        }

        console.log('\n✅ All route prices updated successfully!');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

updateRoutePrices();
