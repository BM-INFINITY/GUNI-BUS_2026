const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const seedDriver = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/university-bus-system';
        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(uri);
        console.log('MongoDB Connected');

        const employeeId = '25001';
        const password = '123';

        // specific details
        const driverData = {
            name: 'Test Driver',
            email: 'driver25001@test.com',
            mobile: '9876543210',
            employeeId: employeeId,
            role: 'driver',
            licenseNumber: 'GJ01 20240001234',
            shift: 'morning',
            isActive: true
        };

        // Check if exists
        const existing = await User.findOne({ employeeId });
        if (existing) {
            console.log('Driver already exists. Updating password...');
            const salt = await bcrypt.genSalt(10);
            existing.password = await bcrypt.hash(password, salt);
            await existing.save();
            console.log('Driver password updated to 123');
        } else {
            console.log('Creating new driver...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newDriver = new User({
                ...driverData,
                password: hashedPassword
            });

            await newDriver.save();
            console.log('Driver created successfully');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedDriver();
