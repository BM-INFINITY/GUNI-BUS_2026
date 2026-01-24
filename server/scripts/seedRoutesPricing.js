const mongoose = require("mongoose");
const Route = require("../models/Route"); // adjust path if needed
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const routePrices = [
    { routeNumber: "MSN-01", single: 30, round: 60 },      // Mehsana
    { routeNumber: "GNR-01", single: 60, round: 120 },     // Gandhinagar
    { routeNumber: "AMD-01", single: 60, round: 120 },     // Ahmedabad
    { routeNumber: "PLN-01", single: 60, round: 120 },     // Palanpur
    { routeNumber: "HMT-01", single: 50, round: 100 },     // Himmatnagar
    { routeNumber: "SDP-01", single: 40, round: 80 },      // Sidhpur
    { routeNumber: "VJP-01", single: 40, round: 80 },      // Vijapur
    { routeNumber: "PTN-01", single: 50, round: 100 },     // Patan
    { routeNumber: "UNJ-01", single: 50, round: 100 },     // Unjha
    { routeNumber: "KDI-01", single: 40, round: 80 },      // Kadi
    { routeNumber: "KLL-01", single: 50, round: 100 },     // Kalol
    { routeNumber: "IDR-01", single: 50, round: 100 }      // Idar
];

async function updateTicketPrices() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("connected");

        for (const route of routePrices) {
            const result = await Route.updateOne({ routeNumber: route.routeNumber }, {
                $set: {
                    "ticketPrices.single": route.single,
                    "ticketPrices.round": route.round
                }
            });

            if (result.matchedCount > 0) {
                console.log(`✅ Updated prices for ${route.routeNumber}`);
            } else {
                console.log(`❌ Route not found: ${route.routeNumber}`);
            }
        }

        console.log("🎉 Ticket prices updated successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error updating ticket prices:", error);
        process.exit(1);
    }
}

updateTicketPrices();