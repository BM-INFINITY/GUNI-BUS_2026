const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const fixIndexes = async () => {
    await connectDB();

    try {
        const collection = mongoose.connection.collection('dailyattendances');

        console.log("🔍 Checking indexes...");
        const indexes = await collection.indexes();
        console.log("Current Indexes:", indexes.map(i => i.name));

        const problemIndexes = ["passId_1_date_1", "passId_1_date_1_shift_1"];

        for (const problemIndex of problemIndexes) {
            const hasProblem = indexes.find(i => i.name === problemIndex && i.unique);

            if (hasProblem) {
                console.log(`\n⚠️  Found blocking UNIQUE index: ${problemIndex}`);
                console.log("   Dropping index...");

                await collection.dropIndex(problemIndex);
                console.log("✅ Index dropped successfully.");
            } else {
                console.log(`\nℹ️  Index ${problemIndex} is either missing or not unique (Good).`);
            }
        }

        // Re-create as non-unique (standard lookup)
        console.log("   Ensuring non-unique indexes exist...");
        await collection.createIndex({ passId: 1, date: 1 }, { background: true });
        console.log("✅ Index re-created.");

    } catch (error) {
        console.error("Fix failed:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

fixIndexes();
