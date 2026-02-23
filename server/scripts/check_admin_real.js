const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ enrollmentNumber: 'admin' });
        if (admin) {
            console.log('Admin User Found:', {
                enrollmentNumber: admin.enrollmentNumber,
                role: admin.role,
                isActive: admin.isActive,
                name: admin.name
            });
        } else {
            console.log('Admin User NOT Found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAdmin();
