const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Enrollment:', existingAdmin.enrollmentNumber || 'N/A');
            await mongoose.connection.close();
            return;
        }

        // Hash password
        const password = 'admin123'; // Change this!
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        const admin = new User({
            name: 'Admin User',
            email: 'admin@university.edu',
            enrollmentNumber: 'ADMIN001',
            password: hashedPassword,
            role: 'admin',
            phone: '1234567890',
            department: 'Administration',
            year: 0
        });

        await admin.save();

        console.log('✅ Admin user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Login Credentials:');
        console.log('   Enrollment Number: ADMIN001');
        console.log('   Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  Please change the password after first login!');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

createAdminUser();
