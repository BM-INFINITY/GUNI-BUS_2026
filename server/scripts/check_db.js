const User = require('../models/User');
const mongoose = require('mongoose');
require('dotenv').config();

async function debugStudent() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const pass = await mongoose.connection.db.collection('buspasses').findOne({ studentName: /BHAVY patel/i });
        if (pass) {
            console.log('BHAVY Pass Details:', JSON.stringify(pass, null, 2));
            const route = await mongoose.connection.db.collection('routes').findOne({ _id: pass.route });
            console.log('Referenced Route:', JSON.stringify(route, null, 2));
        } else {
            console.log('BHAVY not found in buspasses');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugStudent();
