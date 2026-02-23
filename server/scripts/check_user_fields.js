const mongoose = require('mongoose');
require('dotenv').config();

async function debugUserFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await mongoose.connection.db.collection('users').findOne({ name: /BHAVY patel/i });
        if (user) {
            console.log('--- User DB Fields ---');
            for (let key in user) {
                if (key !== 'password' && key !== 'profilePhoto') {
                    console.log(`${key}: ${JSON.stringify(user[key])}`);
                }
            }
        } else {
            console.log('User not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugUserFields();
