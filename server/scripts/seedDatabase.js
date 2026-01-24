const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Create admin user
        console.log('👨‍💼 Creating admin user...');
        const existingAdmin = await User.findOne({ enrollmentNumber: 'admin' });

        if (!existingAdmin) {
            const password = '123';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                name: 'Admin User',
                email: 'admin@university.edu',
                enrollmentNumber: 'admin',
                password: hashedPassword,
                role: 'admin',
                mobile: '1234567890',
                department: 'Administration',
                year: 1,
                dateOfBirth: new Date('1990-01-01'),
                isProfileComplete: true,
                hasCompletedProfileOnce: true
            });
            console.log('✅ Admin user created');
        } else {
            console.log('⏭️  Admin user already exists');
        }

        // Create ONE sample student for testing
        console.log('\n👨‍🎓 Creating sample student...');
        const existingStudent = await User.findOne({ enrollmentNumber: '202201001' });

        if (!existingStudent) {
            const password = '123';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                name: 'Ravi Patel',
                email: 'ravi.patel@student.university.edu',
                enrollmentNumber: '202201001',
                password: hashedPassword,
                role: 'student',
                mobile: '9876543210',
                department: 'Computer Science',
                year: 2,
                dateOfBirth: new Date('2004-03-15'),
                isProfileComplete: false,  // Student will upload photo
                hasCompletedProfileOnce: false
            });
            console.log('✅ Sample student created');
        } else {
            console.log('⏭️  Sample student already exists');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 Database seeded successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📋 Login Credentials:\n');
        console.log('👨‍💼 Admin:');
        console.log('   Enrollment: admin');
        console.log('   Password: 123\n');
        console.log('👨‍🎓 Sample Student:');
        console.log('   Enrollment: 202201001');
        console.log('   Password: 123');
        console.log('\n💡 Tip: Login as admin and add more students from the admin panel!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

seedDatabase();
