const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function resetAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123', salt);

        const result = await User.findOneAndUpdate(
            { enrollmentNumber: 'admin' },
            {
                password: hashedPassword,
                role: 'admin',
                isActive: true,
                isProfileComplete: true
            },
            { upsert: true, new: true }
        );

        console.log('Admin user updated/created:', result.enrollmentNumber);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetAdmin();
