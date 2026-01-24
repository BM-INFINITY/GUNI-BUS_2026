const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:admin123@cluster0.optglus.mongodb.net/university-bus-system?retryWrites=true&w=majority';

async function dropIndex() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('dailyattendances');

        // List indexes first
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes.map(i => i.name));

        const indexName = 'passId_1_date_1_tripType_1';

        // Check if exists
        const exists = indexes.find(i => i.name === indexName);
        if (exists) {
            console.log(`Dropping index: ${indexName}...`);
            await collection.dropIndex(indexName);
            console.log('✅ Index dropped successfully.');
        } else {
            console.log('⚠️ Index not found. It might have disjoint name or already dropped.');

            // Try to find one causing issues
            const similar = indexes.find(i => i.key.passId && i.key.date && i.key.tripType);
            if (similar) {
                console.log(`Found similar index: ${similar.name}. Dropping...`);
                await collection.dropIndex(similar.name);
                console.log('✅ Index dropped.');
            }
        }

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

dropIndex();
