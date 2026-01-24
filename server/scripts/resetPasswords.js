const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // adjust path if needed
require("dotenv").config();

async function resetPasswords() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123", salt);

        const result = await User.updateMany({ role: "student" }, { $set: { password: hashedPassword } });

        console.log("Passwords updated for students:", result.modifiedCount);
        process.exit();
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

resetPasswords();