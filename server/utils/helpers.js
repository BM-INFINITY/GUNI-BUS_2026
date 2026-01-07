const QRCode = require('qrcode');

const generateQRCode = async (data) => {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(data));
        return qrCodeDataUrl;
    } catch (error) {
        throw new Error('Failed to generate QR code');
    }
};

const generateTicketNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `TKT${timestamp}${random}`;
};

const getCurrentShift = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Convert to minutes

    // Morning shift: 8:30 AM to 2:10 PM (510 to 850 minutes)
    // Afternoon shift: 11:40 AM to 5:20 PM (700 to 1040 minutes)

    const morningStart = 8 * 60 + 30; // 510 minutes (8:30 AM)
    const morningEnd = 14 * 60 + 10; // 850 minutes (2:10 PM)
    const afternoonStart = 11 * 60 + 40; // 700 minutes (11:40 AM)
    const afternoonEnd = 17 * 60 + 20; // 1040 minutes (5:20 PM)

    // Check if in morning shift priority window (before 11:40 AM)
    if (currentTime >= morningStart && currentTime < afternoonStart) {
        return 'morning';
    }
    // Check if in afternoon shift
    else if (currentTime >= afternoonStart && currentTime <= afternoonEnd) {
        return 'afternoon';
    }
    // Default to morning for early times, afternoon for late times
    else if (currentTime < morningStart) {
        return 'morning';
    } else {
        return 'afternoon';
    }
};

module.exports = {
    generateQRCode,
    generateTicketNumber,
    getCurrentShift
};
