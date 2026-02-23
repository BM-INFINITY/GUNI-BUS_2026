const mongoose = require('mongoose');
require('dotenv').config();

async function debugUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await mongoose.connection.db.collection('users').findOne({ name: /BHAVY patel/i });
        if (user) {
            console.log('User Keys:', Object.keys(user));
            console.log('User Role:', user.role);
            console.log('User Route:', user.route);
            console.log('User AssignedRoute:', user.assignedRoute);
            console.log('User Bus:', user.bus);
            console.log('User Shift:', user.shift);
        } else {
            console.log('User not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugUser();
