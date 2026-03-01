/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║             GUNI-BUS 2026 — DEMO DATA SEEDER                   ║
 * ║                                                                  ║
 * ║  Run: node server/scripts/seedDemoData.js                       ║
 * ║  Safe to re-run — skips already-existing records                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');
const QRCode = require('qrcode');
const moment = require('moment-timezone');
const { generateReferenceNumber } = require('../utils/referenceGenerator');

// ── Models ─────────────────────────────────────────────────────────────────
const User = require('../models/User');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const BusPass = require('../models/BusPass');
const DayTicket = require('../models/DayTicket');
const DailyAttendance = require('../models/DailyAttendance');
const StudentJourneyLog = require('../models/StudentJourneyLog');
const RideIntent = require('../models/RideIntent');
const DemandForecast = require('../models/DemandForecast');

// ── Config ──────────────────────────────────────────────────────────────────
const QR_SECRET = process.env.QR_SECRET || '6eb798d4dcb2b814b29643b8437a91b2';
const DAYS_BACK = 30;   // How many days of history to generate
const IST = 'Asia/Kolkata';

// ── Helpers ─────────────────────────────────────────────────────────────────

function istDay(offsetFromToday = 0) {
    return moment().tz(IST).startOf('day').subtract(-offsetFromToday, 'days');
}

function dateStr(m) {
    return m.format('YYYY-MM-DD');
}

function signQR(id, userId, validUntil) {
    const expiry = validUntil.toISOString();
    const raw = `${id}|${userId}|${expiry}`;
    const sig = crypto.createHmac('sha256', QR_SECRET).update(raw).digest('hex');
    return `GUNI|${raw}|${sig}`;
}

function chance(probability) {
    return Math.random() < probability;
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Student persona determines attendance & intent accuracy
function getPersona(index, total) {
    const pct = index / total;
    if (pct < 0.40) return { name: 'reliable', attendRate: 0.85, intentAccuracy: 0.90 };
    if (pct < 0.75) return { name: 'occasional', attendRate: 0.60, intentAccuracy: 0.70 };
    return { name: 'unreliable', attendRate: 0.40, intentAccuracy: 0.50 };
}

// Weekday factor — higher Mon-Wed, lower Thu-Fri
function weekdayFactor(dayOfWeek) {
    const factors = { 1: 1.1, 2: 1.05, 3: 1.0, 4: 0.90, 5: 0.85, 6: 0.80 };
    return factors[dayOfWeek] || 0;
}

// Reference numbers now use the official generateReferenceNumber(routeNumber) utility

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🚌  GUNI-BUS Demo Seeder Starting...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  MongoDB connected\n');

    // ── Fetch foundation data ───────────────────────────────────────────────
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) throw new Error('No admin user found. Create one first.');

    const routes = await Route.find({ isActive: true });
    if (!routes.length) throw new Error('No active routes found. Create at least one route.');

    const drivers = await User.find({ role: 'driver' });
    const students = await User.find({ role: 'student' }).limit(50);
    if (!students.length) throw new Error('No student accounts found. Register some students first.');

    console.log(`📋  Found ${students.length} students, ${routes.length} routes, ${drivers.length} drivers\n`);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 1 — ADD BUSES
    // ════════════════════════════════════════════════════════════════════════
    console.log('🚌  Step 1/8: Adding buses...');
    const busTemplates = [
        { busNumber: 'GU-01', registrationNumber: 'GJ18AB1001', capacity: 45, manufacturer: 'Tata', model: 'Starbus Ultra', yearOfManufacture: 2022 },
        { busNumber: 'GU-02', registrationNumber: 'GJ18AB1002', capacity: 50, manufacturer: 'Ashok Leyland', model: 'Viking', yearOfManufacture: 2021 },
        { busNumber: 'GU-03', registrationNumber: 'GJ18AB1003', capacity: 40, manufacturer: 'Tata', model: 'LP 713', yearOfManufacture: 2023 },
        { busNumber: 'GU-04', registrationNumber: 'GJ18AB1004', capacity: 52, manufacturer: 'Volvo', model: 'B7R', yearOfManufacture: 2020 },
        { busNumber: 'GU-05', registrationNumber: 'GJ18AB1005', capacity: 35, manufacturer: 'Eicher', model: 'Skyline Pro', yearOfManufacture: 2022 },
    ];
    const insuranceExpiry = moment().add(2, 'years').toDate();
    const fitnessExpiry = moment().add(1, 'year').toDate();

    const createdBuses = [];
    for (let i = 0; i < busTemplates.length; i++) {
        const t = busTemplates[i];
        const existing = await Bus.findOne({ busNumber: t.busNumber });
        if (existing) { createdBuses.push(existing); continue; }
        const route = routes[i % routes.length];
        const driver = drivers[i % Math.max(drivers.length, 1)];
        const bus = await Bus.create({
            ...t,
            status: 'active',
            isActive: true,
            assignedRoute: route._id,
            assignedDriver: driver?._id || null,
            insuranceExpiryDate: insuranceExpiry,
            fitnessExpiryDate: fitnessExpiry,
            lastMaintenanceDate: moment().subtract(1, 'month').toDate(),
            nextMaintenanceDate: moment().add(3, 'months').toDate(),
            createdBy: adminUser._id,
        });
        createdBuses.push(bus);
        console.log(`   ✅  Bus ${bus.busNumber} created`);
    }
    console.log(`   Total buses: ${createdBuses.length}\n`);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 2 — GENERATE APPROVED BUS PASSES
    // ════════════════════════════════════════════════════════════════════════
    console.log('🎫  Step 2/8: Generating bus passes...');
    const passMap = {}; // userId → BusPass

    // First, collect existing passes
    const existingPasses = await BusPass.find({ status: 'approved' });
    existingPasses.forEach(p => { passMap[p.userId.toString()] = p; });

    const shifts = ['morning', 'afternoon'];

    for (let i = 0; i < students.length; i++) {
        const s = students[i];
        const sid = s._id.toString();
        if (passMap[sid]) { continue; } // Already has pass

        const route = routes[i % routes.length];
        const shift = shifts[i % 2];
        const stops = route.shifts?.find(sh => sh.shiftType === shift)?.stops || [];
        const stop = stops.length ? pick(stops).name : route.startPoint;
        const validFrom = moment().subtract(2, 'months').toDate();
        const validUntil = moment().add(4, 'months').toDate();

        const passId = new mongoose.Types.ObjectId();
        const qrPayload = signQR(passId, s._id, validUntil);
        const qrCode = await QRCode.toDataURL(qrPayload);

        const pass = await BusPass.create({
            _id: passId,
            referenceNumber: generateReferenceNumber(route.routeNumber),
            userId: s._id,
            enrollmentNumber: s.enrollmentNumber || `EN${i + 1000}`,
            studentName: s.name,
            studentPhoto: s.profilePhoto || '',
            dateOfBirth: s.dateOfBirth || new Date('2003-06-15'),
            mobile: s.mobile || '9000000000',
            email: s.email,
            department: s.department || 'Engineering',
            year: s.year || 3,
            route: route._id,
            selectedStop: stop,
            shift,
            amount: route.semesterCharge || 15000,
            status: 'approved',
            paymentStatus: 'completed',
            razorpayPaymentId: `pay_demo_${Date.now()}${i}`,
            applicationDate: validFrom,
            validFrom,
            validUntil,
            approvedBy: adminUser._id,
            approvedAt: validFrom,
            qrCode,
        });
        passMap[sid] = pass;
        process.stdout.write('.');
    }
    console.log(`\n   ✅  ${Object.keys(passMap).length} passes ready\n`);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 3 — RIDE INTENTS (30 days back, skip Sundays)
    // ════════════════════════════════════════════════════════════════════════
    console.log('📊  Step 3/8: Generating ride intents...');
    const allDates = [];
    for (let d = DAYS_BACK; d >= 1; d--) {
        const m = istDay(-d);
        if (m.day() !== 0) allDates.push(m); // skip Sundays
    }

    let intentCount = 0;
    const intentLookup = {}; // `${studentId}_${date}` → actualBoarded boolean

    for (let i = 0; i < students.length; i++) {
        const s = students[i];
        const pass = passMap[s._id.toString()];
        if (!pass) continue;
        const persona = getPersona(i, students.length);
        let consecutiveAbsences = 0;

        for (const dayMoment of allDates) {
            const dow = dayMoment.day(); // 0=Sun
            const wFactor = weekdayFactor(dow);
            const adjustedRate = persona.attendRate * wFactor;
            const dateKey = dateStr(dayMoment);

            // Determine if student declared intent and if they actually boarded
            const willBoard = chance(adjustedRate);
            const intentStatus = chance(persona.intentAccuracy)
                ? (willBoard ? 'YES' : 'NO')
                : (willBoard ? 'NO' : 'YES'); // mismatched for unreliable students

            const actualBoarded = willBoard;
            const travelDate = dayMoment.toDate();

            try {
                await RideIntent.create({
                    studentId: s._id,
                    routeId: pass.route,
                    travelDate,
                    intentStatus,
                    submittedAt: dayMoment.clone().subtract(1, 'day').set({ hour: 20, minute: Math.floor(Math.random() * 59) }).toDate(),
                    actualBoarded,
                    rewardPointsCalculated: true,
                    reliabilityScoreImpact:
                        intentStatus === 'YES' && actualBoarded ? 0 :
                            intentStatus === 'NO' && !actualBoarded ? 0 :
                                intentStatus === 'YES' && !actualBoarded ? -5 : 0,
                    mlFeatures: {
                        dayOfWeek: dow,
                        month: dayMoment.month() + 1,
                        consecutiveAbsences,
                    },
                });
                intentLookup[`${s._id}_${dateKey}`] = actualBoarded;
                intentCount++;
                if (!actualBoarded) consecutiveAbsences++;
                else consecutiveAbsences = 0;
            } catch (e) {
                // Skip duplicate
            }
        }
    }
    console.log(`   ✅  ${intentCount} ride intents created\n`);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 4 — DAILY ATTENDANCE + JOURNEY LOGS
    // ════════════════════════════════════════════════════════════════════════
    console.log('📅  Step 4/8: Generating attendance records...');
    let attendCount = 0;
    const driverUser = drivers[0] || adminUser;

    for (const dayMoment of allDates) {
        const dateKey = dateStr(dayMoment);

        for (let i = 0; i < students.length; i++) {
            const s = students[i];
            const pass = passMap[s._id.toString()];
            if (!pass) continue;

            const boarded = intentLookup[`${s._id}_${dateKey}`];
            if (!boarded) continue; // absent → no attendance record

            const shift = pass.shift;
            const boardingHour = shift === 'morning' ? 7 : 10;
            const returnHour = shift === 'morning' ? 15 : 17;

            const boardTime = dayMoment.clone().set({ hour: boardingHour, minute: Math.floor(Math.random() * 30) }).toDate();
            const retTime = dayMoment.clone().set({ hour: returnHour, minute: Math.floor(Math.random() * 30) }).toDate();

            // Boarding attendance
            try {
                await DailyAttendance.create({
                    passId: pass._id,
                    userId: s._id,
                    routeId: pass.route,
                    date: dateKey,
                    shift,
                    tripType: 'pickup',
                    scanPhase: 'boarding',
                    checkInTime: boardTime,
                    checkInBy: driverUser._id,
                    status: 'checked-in',
                });
                attendCount++;
            } catch (_) { }

            // Return attendance (random 90% chance if they boarded)
            if (chance(0.90)) {
                try {
                    await DailyAttendance.create({
                        passId: pass._id,
                        userId: s._id,
                        routeId: pass.route,
                        date: dateKey,
                        shift,
                        tripType: 'drop',
                        scanPhase: 'return',
                        checkInTime: retTime,
                        checkInBy: driverUser._id,
                        status: 'checked-in',
                    });
                    attendCount++;
                } catch (_) { }
            }

            // Journey Log (one per student per day)
            try {
                await StudentJourneyLog.create({
                    userId: s._id,
                    enrollmentNumber: s.enrollmentNumber || `EN${i + 1000}`,
                    studentName: s.name,
                    date: dateKey,
                    shift,
                    routeId: pass.route,
                    passType: 'bus_pass',
                    passId: pass._id,
                    journeyStatus: 'completed',
                    onboarded: { time: boardTime, scannedBy: driverUser._id },
                    leftForHome: { time: retTime },
                });
            } catch (_) { }
        }
    }
    console.log(`   ✅  ${attendCount} attendance records created\n`);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 5 — DEMAND FORECASTS
    // ════════════════════════════════════════════════════════════════════════
    console.log('📈  Step 5/8: Building demand forecasts...');
    let forecastCount = 0;
    const avgBusCapacity = Math.round(createdBuses.reduce((s, b) => s + b.capacity, 0) / Math.max(createdBuses.length, 1));

    for (const dayMoment of allDates) {
        for (const route of routes) {
            // Aggregate intents for this route/date
            const dayIntents = await RideIntent.find({
                routeId: route._id,
                travelDate: {
                    $gte: dayMoment.clone().startOf('day').toDate(),
                    $lte: dayMoment.clone().endOf('day').toDate(),
                },
            });

            const yes = dayIntents.filter(i => i.intentStatus === 'YES').length;
            const no = dayIntents.filter(i => i.intentStatus === 'NO').length;
            if (yes + no === 0) continue;

            const cap = avgBusCapacity || 45;
            const recommended = Math.max(1, Math.ceil(yes / cap));
            const actualBoarded = dayIntents.filter(i => i.actualBoarded).length;
            const accuracy = yes > 0 ? Math.round((Math.abs(yes - actualBoarded) / yes) * -100 + 100) : null;

            try {
                await DemandForecast.findOneAndUpdate(
                    { routeId: route._id, date: dayMoment.toDate() },
                    {
                        routeId: route._id,
                        date: dayMoment.toDate(),
                        yesIntentCount: yes,
                        noIntentCount: no,
                        noDeclarationCount: 0,
                        expectedPassengers: yes,
                        recommendedBuses: recommended,
                        actualPassengers: actualBoarded,
                        predictionAccuracy: accuracy,
                        busCapacitySnapshot: cap,
                        generatedAt: dayMoment.clone().set({ hour: 22, minute: 5 }).toDate(),
                    },
                    { upsert: true }
                );
                forecastCount++;
            } catch (_) { }
        }
    }
    console.log(`   ✅  ${forecastCount} forecast records created\n`);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 6 — DAY TICKETS (past 20 tickets)
    // ════════════════════════════════════════════════════════════════════════
    console.log('🎟️   Step 6/8: Creating day tickets...');
    let ticketCount = 0;
    const ticketStudents = students.slice(0, 15); // First 15 students buy day tickets

    for (let i = 0; i < 20; i++) {
        const s = ticketStudents[i % ticketStudents.length];
        const route = routes[i % routes.length];
        const offset = -(i + 1); // Past days
        const travelDay = istDay(offset);
        if (travelDay.day() === 0) continue; // Skip Sunday

        const travelDate = travelDay.startOf('day').toDate();
        const ticketType = chance(0.6) ? 'round' : 'single';
        const maxScans = ticketType === 'round' ? 2 : 1;
        const amount = ticketType === 'round'
            ? (route.ticketPrices?.round || 100)
            : (route.ticketPrices?.single || 50);
        const validUntil = travelDay.clone().endOf('day').toDate();
        const ticketId = new mongoose.Types.ObjectId();
        const shifts_arr = ['morning', 'afternoon'];
        const shift = shifts_arr[i % 2];
        const stops = route.shifts?.find(sh => sh.shiftType === shift)?.stops || [];
        const stop = stops.length ? pick(stops).name : route.startPoint;

        const qrPayload = signQR(ticketId, s._id, validUntil);
        const qrCode = await QRCode.toDataURL(qrPayload);

        const boardTime = travelDay.clone().set({ hour: shift === 'morning' ? 7 : 10, minute: 15 }).toDate();
        const scansArr = [{ scannedAt: boardTime, scannedBy: driverUser._id, tripType: 'pickup' }];
        if (ticketType === 'round') scansArr.push({ scannedAt: travelDay.clone().set({ hour: 15, minute: 30 }).toDate(), scannedBy: driverUser._id, tripType: 'drop' });

        try {
            await DayTicket.create({
                _id: ticketId,
                referenceNumber: generateReferenceNumber(route.routeNumber),
                userId: s._id,
                enrollmentNumber: s.enrollmentNumber || `EN${i + 1000}`,
                studentName: s.name,
                studentPhoto: s.profilePhoto || '',
                dateOfBirth: s.dateOfBirth || new Date('2003-06-15'),
                mobile: s.mobile || '9000000000',
                email: s.email,
                department: s.department || 'Engineering',
                year: s.year || 3,
                route: route._id,
                selectedStop: stop,
                shift,
                ticketType,
                amount,
                paymentStatus: 'completed',
                razorpayPaymentId: `pay_dt_${Date.now()}${i}`,
                travelDate,
                validFrom: travelDate,
                validUntil,
                qrCode,
                status: 'used',
                scanCount: scansArr.length,
                maxScans,
                scans: scansArr,
                paymentMethod: 'online',
            });
            ticketCount++;
        } catch (_) { }
    }
    console.log(`   ✅  ${ticketCount} day tickets created\n`);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 7 — UPDATE USER REWARD POINTS & RELIABILITY SCORES
    // ════════════════════════════════════════════════════════════════════════
    console.log('🏆  Step 7/8: Updating reward points & reliability scores...');
    let updatedUsers = 0;

    for (const s of students) {
        const intents = await RideIntent.find({ studentId: s._id, rewardPointsCalculated: true });
        let points = s.rewardPoints || 0;
        let reliability = s.reliabilityScore ?? 100;
        let totalDeclarations = 0;
        let correctDeclarations = 0;

        for (const intent of intents) {
            const correct =
                (intent.intentStatus === 'YES' && intent.actualBoarded) ||
                (intent.intentStatus === 'NO' && !intent.actualBoarded);
            if (correct) {
                points += intent.intentStatus === 'YES' ? 10 : 5;
                correctDeclarations++;
            } else if (intent.intentStatus === 'YES' && !intent.actualBoarded) {
                points = Math.max(0, points - 8);
            }
            totalDeclarations++;
        }

        reliability = totalDeclarations > 0
            ? Math.round((correctDeclarations / totalDeclarations) * 100)
            : 100;

        await User.findByIdAndUpdate(s._id, {
            rewardPoints: Math.min(points, 9999),
            reliabilityScore: Math.max(0, Math.min(reliability, 100)),
        });
        updatedUsers++;
    }
    console.log(`   ✅  ${updatedUsers} students updated\n`);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 8 — SUMMARY
    // ════════════════════════════════════════════════════════════════════════
    const totalPasses = await BusPass.countDocuments({ status: 'approved' });
    const totalAttend = await DailyAttendance.countDocuments();
    const totalIntents = await RideIntent.countDocuments();
    const totalForecasts = await DemandForecast.countDocuments();
    const totalTickets = await DayTicket.countDocuments({ status: 'used' });
    const totalBuses = await Bus.countDocuments({ isActive: true });

    console.log('═══════════════════════════════════════════════');
    console.log('  🎉  DEMO DATA SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════════');
    console.log(`  🚌  Active Buses       : ${totalBuses}`);
    console.log(`  🎫  Approved Passes    : ${totalPasses}`);
    console.log(`  📅  Attendance Records : ${totalAttend}`);
    console.log(`  📊  Ride Intents       : ${totalIntents}`);
    console.log(`  📈  Demand Forecasts   : ${totalForecasts}`);
    console.log(`  🎟️   Used Day Tickets   : ${totalTickets}`);
    console.log('═══════════════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('✅  Disconnected. All done!\n');
}

main().catch(err => {
    console.error('\n❌  Seeder failed:', err.message);
    mongoose.disconnect();
    process.exit(1);
});
