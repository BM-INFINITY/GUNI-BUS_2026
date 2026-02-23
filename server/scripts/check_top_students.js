const mongoose = require('mongoose');
require('dotenv').config();

async function checkTopStudents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await mongoose.connection.db.collection('users').find({ role: 'student' }).limit(5).toArray();
        console.log('--- Students ---');
        users.forEach(u => {
            console.log(`Name: ${u.name}`);
            console.log(`Fields: ${JSON.stringify(u, (k, v) => k === 'profilePhoto' || k === 'password' ? '...' : v, 2)}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTopStudents();
