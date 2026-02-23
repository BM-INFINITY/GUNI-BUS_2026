const mongoose = require('mongoose');
require('dotenv').config();

async function debugFullUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await mongoose.connection.db.collection('users').findOne({ name: /BHAVY patel/i });
        if (user) {
            console.log('=== FULL USER DOCUMENT ===');
            console.log(JSON.stringify(user, (key, value) => {
                // Truncate profile photo or large strings
                if (typeof value === 'string' && value.length > 50) {
                    return value.substring(0, 50) + '...';
                }
                return value;
            }, 2));
        } else {
            console.log('User not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugFullUser();
