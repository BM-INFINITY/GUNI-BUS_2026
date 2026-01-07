const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const resetUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Delete all existing users
        await User.deleteMany({});
        console.log('✅ Deleted all existing users\n');

        // Hash password '123' for all users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123', salt);

        // Create simple users
        const users = [
            {
                name: 'Admin User',
                email: 'admin@university.edu',
                enrollmentNumber: 'admin',
                password: hashedPassword,
                role: 'admin',
                phone: '1234567890',
                department: 'Administration',
                year: 0
            },
            {
                name: 'Student User',
                email: 'student@university.edu',
                enrollmentNumber: 'student',
                password: hashedPassword,
                role: 'student',
                phone: '9876543210',
                department: 'Computer Science',
                year: 2
            },
            {
                name: 'Driver User',
                email: 'driver@university.edu',
                enrollmentNumber: 'driver',
                password: hashedPassword,
                role: 'driver',
                phone: '8765432109',
                department: 'Transport',
                year: 0
            }
        ];

        await User.insertMany(users);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ New users created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📋 Simple Login Credentials:\n');
        console.log('👨‍💼 Admin:');
        console.log('   Enrollment: admin');
        console.log('   Password: 123\n');
        console.log('👨‍🎓 Student:');
        console.log('   Enrollment: student');
        console.log('   Password: 123\n');
        console.log('🚌 Driver:');
        console.log('   Enrollment: driver');
        console.log('   Password: 123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

resetUsers();
