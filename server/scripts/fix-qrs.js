require('dotenv').config();
const mongoose = require('mongoose');
const BusPass = require('../models/BusPass');
const DayTicket = require('../models/DayTicket');
const crypto = require('crypto');
const QRCode = require('qrcode');

async function fixQRs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const secret = process.env.QR_SECRET;
        if (!secret) throw new Error('QR_SECRET missing');

        const passes = await BusPass.find({ status: 'approved' });
        let passCount = 0;
        for (const pass of passes) {
            const expiry = pass.validUntil.toISOString();
            const rawData = `${pass._id}|${pass.userId}|${expiry}`;
            const signature = crypto.createHmac('sha256', secret).update(rawData).digest('hex');
            const qrPayload = `GUNI|${rawData}|${signature}`;
            pass.qrCode = await QRCode.toDataURL(qrPayload);
            await pass.save();
            passCount++;
        }
        console.log(`Fixed ${passCount} Bus Passes`);

        const tickets = await DayTicket.find({ status: 'active' });
        let ticketCount = 0;
        for (const ticket of tickets) {
            const expiry = ticket.validUntil.toISOString();
            const rawData = `${ticket._id}|${ticket.userId}|${expiry}`;
            const signature = crypto.createHmac('sha256', secret).update(rawData).digest('hex');
            const qrPayload = `GUNI|${rawData}|${signature}`;
            ticket.qrCode = await QRCode.toDataURL(qrPayload);
            await ticket.save();
            ticketCount++;
        }
        console.log(`Fixed ${ticketCount} Day Tickets`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixQRs();
