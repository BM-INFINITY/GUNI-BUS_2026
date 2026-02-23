const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function createSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123', salt);

        const result = await User.findOneAndUpdate(
            { enrollmentNumber: 'superadmin' },
            {
                name: 'Super Admin',
                email: 'superadmin@university.edu',
                password: hashedPassword,
                role: 'admin',
                isActive: true,
                isProfileComplete: true,
                hasCompletedProfileOnce: true
            },
            { upsert: true, new: true }
        );

        console.log('Superadmin user created:', result.enrollmentNumber);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createSuperAdmin();
