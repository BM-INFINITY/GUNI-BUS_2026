const mongoose = require('mongoose');
require('dotenv').config();
const Route = require('../models/Route');

const circularRoutes = [
  { routeNumber: 'HMT-01', morning: '06:30', afternoon: '10:00', fare: 14500 },
  { routeNumber: 'AMD-01', morning: '06:30', afternoon: '09:00', fare: 16500 },
  { routeNumber: 'GNR-01', morning: '07:10', afternoon: '09:45', fare: 16000 },
  { routeNumber: 'IDR-01', morning: '06:15', afternoon: '09:30', fare: 17500 },
  { routeNumber: 'MSN-01', morning: '07:45', afternoon: '10:50', fare: 8500 },
  { routeNumber: 'PLN-01', morning: '06:20', afternoon: '09:20', fare: 14500 },
  { routeNumber: 'UNJ-01', morning: '07:00', afternoon: '10:00', fare: 11000 },
  { routeNumber: 'SDP-01', morning: '07:00', afternoon: '10:00', fare: 11800 },
  { routeNumber: 'PTN-01', morning: '06:30', afternoon: '09:15', fare: 13500 },
  { routeNumber: 'VJP-01', morning: '06:50', afternoon: '09:45', fare: 13500 },
  { routeNumber: 'KDI-01', morning: '06:50', afternoon: '09:50', fare: 12000 },
  { routeNumber: 'KLL-01', morning: '06:50', afternoon: '10:00', fare: 12000 }
];

// helper
function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + mins);
  return d.toTimeString().slice(0, 5);
}

// fake coordinates generator
function generateStops(startTime) {
  const stops = [];

  let baseLat = 23.0000;
  let baseLng = 72.5000;

  for (let i = 0; i < 10; i++) {
    stops.push({
      name: `Stop ${i + 1}`,
      coordinates: {
        latitude: baseLat + i * 0.01,
        longitude: baseLng + i * 0.01
      },
      arrivalTime: addMinutes(startTime, i * 12)
    });
  }

  return stops;
}

async function updateRoutes() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  for (const config of circularRoutes) {
    const route = await Route.findOne({ routeNumber: config.routeNumber });

    if (!route) {
      console.log(`❌ Route not found: ${config.routeNumber}`);
      continue;
    }

    route.semesterCharge = config.fare;

    route.shifts = [
      {
        shiftType: 'morning',
        stops: generateStops(config.morning)
      },
      {
        shiftType: 'afternoon',
        stops: generateStops(config.afternoon)
      }
    ];

    await route.save();
    console.log(`✅ Updated ${route.routeName}`);
  }

  console.log("\n🎉 All routes updated from circular timings");
  mongoose.disconnect();
}

updateRoutes();
