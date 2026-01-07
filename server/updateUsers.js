const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const updateExistingUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Update all student users to have isProfileComplete = false
        const result = await User.updateMany(
            { role: 'student', isProfileComplete: { $exists: false } },
            { $set: { isProfileComplete: false } }
        );

        console.log(`✅ Updated ${result.modifiedCount} student users`);
        console.log('All students now have isProfileComplete field set to false');
        console.log('Students will need to complete their profile before applying for passes\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

updateExistingUsers();
