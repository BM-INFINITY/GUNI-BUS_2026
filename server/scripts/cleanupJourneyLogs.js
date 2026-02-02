const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const StudentJourneyLog = require('../models/StudentJourneyLog');
const TripCheckpoint = require('../models/TripCheckpoint');

async function cleanupJourneyData() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Delete all StudentJourneyLog documents
        const journeyResult = await StudentJourneyLog.deleteMany({});
        console.log(`Deleted ${journeyResult.deletedCount} StudentJourneyLog documents`);

        // Delete all TripCheckpoint documents
        const checkpointResult = await TripCheckpoint.deleteMany({});
        console.log(`Deleted ${checkpointResult.deletedCount} TripCheckpoint documents`);

        console.log('\n✅ Cleanup complete! Ready for fresh data.');
        console.log('Note: DailyAttendance records preserved for audit trail.');

        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

cleanupJourneyData();
