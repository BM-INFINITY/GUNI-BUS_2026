const mongoose = require('mongoose');
const User = require('../models/User'); // Import model to ensure types are handled
require('dotenv').config();

async function testApiPipeline() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const pipeline = [
            { $match: { role: 'student', name: /BHAVY patel/i } },
            {
                $lookup: {
                    from: 'buspasses',
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$userId", "$$userId"] },
                                        { $eq: ["$status", "approved"] }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 },
                        {
                            $lookup: {
                                from: 'routes',
                                localField: 'route',
                                foreignField: '_id',
                                as: 'routeDetails'
                            }
                        },
                        { $unwind: { path: '$routeDetails', preserveNullAndEmptyArrays: true } }
                    ],
                    as: 'activePass'
                }
            },
            { $unwind: { path: '$activePass', preserveNullAndEmptyArrays: true } }
        ];

        const results = await User.aggregate(pipeline);
        console.log('API Result for BHAVY:', JSON.stringify(results[0], null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testApiPipeline();
