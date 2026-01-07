// Generate unique reference number for bus pass
const generateReferenceNumber = () => {
    const prefix = 'BP';
    const year = new Date().getFullYear().toString().substr(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${year}${month}${random}`;
};

module.exports = { generateReferenceNumber };
