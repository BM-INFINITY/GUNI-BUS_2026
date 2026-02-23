const mongoose = require('mongoose');
require('dotenv').config();

async function findStudentWithRoute() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await mongoose.connection.db.collection('users').findOne({
            role: 'student',
            route: { $exists: true, $ne: null }
        });
        if (user) {
            console.log('Found student with direct route field:', user.name, user.route);
        } else {
            console.log('No students found with direct route field in User collection');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findStudentWithRoute();
