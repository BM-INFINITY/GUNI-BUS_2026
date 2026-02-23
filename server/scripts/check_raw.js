const mongoose = require('mongoose');
require('dotenv').config();

async function checkBhavyRaw() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await mongoose.connection.db.collection('users').findOne({ name: /BHAVY patel/i });
        if (user) {
            const raw = JSON.stringify(user);
            console.log('Contains "route":', raw.toLowerCase().includes('route'));
            console.log('Contains "amd-01":', raw.toLowerCase().includes('amd-01'));
            console.log('Contains "kll-01":', raw.toLowerCase().includes('kll-01'));
            console.log('Raw JSON length:', raw.length);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBhavyRaw();
