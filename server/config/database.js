const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Add database name to URI if not present
        let mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/university-bus-system';

        // For MongoDB Atlas URIs, ensure database name is included
        if (mongoURI.includes('mongodb+srv://') && !mongoURI.includes('mongodb.net/')) {
            mongoURI = mongoURI.replace('mongodb.net/?', 'mongodb.net/university-bus-system?');
        }

        const conn = await mongoose.connect(mongoURI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
