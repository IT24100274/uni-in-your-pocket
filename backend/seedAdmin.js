const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");

    // Check if admin already exists
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      console.log("Admin already exists:", adminExists.email);
      process.exit(0);
    }

    // Create admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const admin = await User.create({
      name: "System Admin",
      email: "admin@unipocket.com",
      password: hashedPassword,
      role: "admin",
      status: "approved",
      department: "Administration",
    });

    console.log("Admin created successfully!");
    console.log("Email: admin@unipocket.com");
    console.log("Password: admin123");
    console.log("IMPORTANT: Change this password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

seedAdmin();