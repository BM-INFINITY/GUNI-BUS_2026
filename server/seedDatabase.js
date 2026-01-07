const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Route = require('./models/Route');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create sample routes
        console.log('\n📍 Creating sample routes...');

        const routes = [
            {
                routeName: 'Main Campus Route',
                routeNumber: 'R1',
                shifts: [
                    {
                        shiftType: 'morning',
                        stops: [
                            { name: 'Main Gate', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '07:00' },
                            { name: 'Library', coordinates: { latitude: 23.0235, longitude: 72.5724 }, arrivalTime: '07:10' },
                            { name: 'Engineering Block', coordinates: { latitude: 23.0245, longitude: 72.5734 }, arrivalTime: '07:20' }
                        ]
                    },
                    {
                        shiftType: 'afternoon',
                        stops: [
                            { name: 'Main Gate', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '14:00' },
                            { name: 'Library', coordinates: { latitude: 23.0235, longitude: 72.5724 }, arrivalTime: '14:10' },
                            { name: 'Engineering Block', coordinates: { latitude: 23.0245, longitude: 72.5734 }, arrivalTime: '14:20' }
                        ]
                    }
                ],
                startPoint: 'Main Gate',
                endPoint: 'Engineering Block',
                isActive: true
            },
            {
                routeName: 'North Campus Route',
                routeNumber: 'R2',
                shifts: [
                    {
                        shiftType: 'morning',
                        stops: [
                            { name: 'North Gate', coordinates: { latitude: 23.0255, longitude: 72.5744 }, arrivalTime: '07:00' },
                            { name: 'Hostel Block', coordinates: { latitude: 23.0265, longitude: 72.5754 }, arrivalTime: '07:10' },
                            { name: 'Science Block', coordinates: { latitude: 23.0275, longitude: 72.5764 }, arrivalTime: '07:20' }
                        ]
                    },
                    {
                        shiftType: 'afternoon',
                        stops: [
                            { name: 'North Gate', coordinates: { latitude: 23.0255, longitude: 72.5744 }, arrivalTime: '14:00' },
                            { name: 'Hostel Block', coordinates: { latitude: 23.0265, longitude: 72.5754 }, arrivalTime: '14:10' },
                            { name: 'Science Block', coordinates: { latitude: 23.0275, longitude: 72.5764 }, arrivalTime: '14:20' }
                        ]
                    }
                ],
                startPoint: 'North Gate',
                endPoint: 'Science Block',
                isActive: true
            }
        ];

        for (const route of routes) {
            const existing = await Route.findOne({ routeNumber: route.routeNumber });
            if (!existing) {
                await Route.create(route);
                console.log(`✅ Created route: ${route.routeName}`);
            } else {
                console.log(`⏭️  Route ${route.routeName} already exists`);
            }
        }

        // Create admin user
        console.log('\n👤 Creating admin user...');
        const existingAdmin = await User.findOne({ role: 'admin' });

        if (!existingAdmin) {
            const password = 'admin123';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                name: 'Admin User',
                email: 'admin@university.edu',
                enrollmentNumber: 'ADMIN001',
                password: hashedPassword,
                role: 'admin',
                phone: '1234567890',
                department: 'Administration',
                year: 0
            });
            console.log('✅ Admin user created');
        } else {
            console.log('⏭️  Admin user already exists');
        }

        // Create sample student
        console.log('\n👨‍🎓 Creating sample student...');
        const existingStudent = await User.findOne({ enrollmentNumber: '2024001' });

        if (!existingStudent) {
            const password = 'student123';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                name: 'John Doe',
                email: 'john.doe@student.university.edu',
                enrollmentNumber: '2024001',
                password: hashedPassword,
                role: 'student',
                phone: '9876543210',
                department: 'Computer Science',
                year: 2
            });
            console.log('✅ Sample student created');
        } else {
            console.log('⏭️  Sample student already exists');
        }

        // Create sample driver
        console.log('\n🚌 Creating sample driver...');
        const existingDriver = await User.findOne({ role: 'driver' });

        if (!existingDriver) {
            const password = 'driver123';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                name: 'Driver Kumar',
                email: 'driver@university.edu',
                enrollmentNumber: 'DRV001',
                password: hashedPassword,
                role: 'driver',
                phone: '8765432109',
                department: 'Transport',
                year: 0
            });
            console.log('✅ Sample driver created');
        } else {
            console.log('⏭️  Sample driver already exists');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 Database seeded successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📋 Login Credentials:\n');
        console.log('👨‍💼 Admin:');
        console.log('   Enrollment: ADMIN001');
        console.log('   Password: admin123\n');
        console.log('👨‍🎓 Student:');
        console.log('   Enrollment: 2024001');
        console.log('   Password: student123\n');
        console.log('🚌 Driver:');
        console.log('   Enrollment: DRV001');
        console.log('   Password: driver123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

seedDatabase();
