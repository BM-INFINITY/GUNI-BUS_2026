const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function findAdmins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const admins = await User.find({ role: 'admin' }, 'enrollmentNumber employeeId name email role');
        console.log('Admins found:', admins);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findAdmins();
