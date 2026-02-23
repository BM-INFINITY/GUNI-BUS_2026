const mongoose = require('mongoose');
require('dotenv').config();

async function checkBhavyPass() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const pass = await mongoose.connection.db.collection('buspasses').findOne({ studentName: /BHAVY patel/i });
        if (pass) {
            const type = pass.route instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof pass.route;
            console.log(`BHAVY Pass Route: ${pass.route} (Type: ${type})`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBhavyPass();
