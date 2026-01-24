const mongoose = require("mongoose");
const dotenv = require("dotenv");
const crypto = require("crypto");
const QRCode = require("qrcode");

const connectDB = require("../config/database");
const BusPass = require("../models/BusPass");

dotenv.config();

// Connect DB
connectDB();

async function migrateQRCodes() {
  try {
    const passes = await BusPass.find({
      status: "approved"
    });

    console.log(`Found ${passes.length} approved passes`);

    for (const pass of passes) {
      if (!pass.validUntil) {
        console.log(`Skipping pass without validity: ${pass.referenceNumber}`);
        continue;
      }

      const expiry = pass.validUntil.toISOString();
      const rawData = `${pass._id}|${pass.userId}|${expiry}`;

      const signature = crypto
        .createHmac("sha256", process.env.QR_SECRET)
        .update(rawData)
        .digest("hex");

      const qrPayload = `GUNI|${rawData}|${signature}`;
      const qrCode = await QRCode.toDataURL(qrPayload);

      pass.qrCode = qrCode;
      await pass.save();

      console.log(`✔ Migrated pass: ${pass.referenceNumber}`);
    }

    console.log("🎉 QR migration completed successfully");
    process.exit(0);

  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrateQRCodes();
