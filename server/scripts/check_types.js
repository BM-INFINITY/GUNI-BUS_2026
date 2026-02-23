const mongoose = require('mongoose');
require('dotenv').config();

async function checkPassRouteType() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const pass = await mongoose.connection.db.collection('buspasses').findOne({ studentName: /BHAVY patel/i });
        if (pass) {
            console.log('Route Field Value:', pass.route);
            console.log('Route Field Type:', typeof pass.route);
            console.log('Route Field Constructor:', pass.route?.constructor?.name);

            const route = await mongoose.connection.db.collection('routes').findOne({});
            console.log('Route _id Value:', route._id);
            console.log('Route _id Type:', typeof route._id);
            console.log('Route _id Constructor:', route._id?.constructor?.name);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPassRouteType();
