const mongoose = require('mongoose');
require('dotenv').config();

async function findUsersWithRoute() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await mongoose.connection.db.collection('users').find({
            $or: [
                { route: { $exists: true } },
                { assignedRoute: { $exists: true } },
                { routeId: { $exists: true } }
            ]
        }).limit(10).toArray();

        console.log(`Found ${users.length} users with route fields`);
        users.forEach(u => {
            console.log(`Name: ${u.name}, Role: ${u.role}, Route: ${u.route}, AssignedRoute: ${u.assignedRoute}, RouteId: ${u.routeId}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findUsersWithRoute();
