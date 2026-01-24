const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixIndexes = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/university-bus-system';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('MongoDB Connected');

        const db = mongoose.connection.db;
        const users = db.collection('users');

        console.log('Listing indexes...');
        const indexes = await users.indexes();
        console.log(indexes);

        // Drop enrollmentNumber index if exists
        try {
            await users.dropIndex('enrollmentNumber_1');
            console.log('Dropped enrollmentNumber_1 index');
        } catch (e) {
            console.log('enrollmentNumber_1 index not found or already dropped');
        }

        // Drop employeeId index if exists
        try {
            await users.dropIndex('employeeId_1');
            console.log('Dropped employeeId_1 index');
        } catch (e) {
            console.log('employeeId_1 index not found or already dropped');
        }

        console.log('Indexes dropped. Mongoose will recreate them on next app start.');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixIndexes();
