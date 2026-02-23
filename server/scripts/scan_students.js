const mongoose = require('mongoose');
require('dotenv').config();

async function scanStudents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await mongoose.connection.db.collection('users').find({ role: 'student' }).limit(50).toArray();
        console.log(`Scanning ${users.length} students...`);
        users.forEach(u => {
            const keys = Object.keys(u);
            const routeKeys = keys.filter(k => k.toLowerCase().includes('route'));
            if (routeKeys.length > 0) {
                console.log(`Student ${u.name} has route keys: ${routeKeys.join(', ')}`);
                routeKeys.forEach(k => console.log(`  ${k}: ${u[k]}`));
            }
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

scanStudents();
