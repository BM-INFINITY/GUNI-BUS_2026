// Generate unique reference number for bus pass


const generateReferenceNumber = (routeNumber) => {
    const prefix = 'GUNI';
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random

    // Remove dash from AMD-01 → AMD01
    const cleanRouteNumber = routeNumber.replace('-', '').toUpperCase();

    return `${prefix}-${cleanRouteNumber}-${year}${month}-${random}`;
};

module.exports = { generateReferenceNumber };