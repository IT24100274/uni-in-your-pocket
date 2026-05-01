const mongoose = require("mongoose");

// Placement Schema
// This stores the internship placement details for each student
const placementSchema = new mongoose.Schema(
  {
    // Reference to the student who owns this placement
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Company details
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    companyAddress: {
      type: String,
      required: [true, "Company address is required"],
      trim: true,
    },

    // Supervisor details
    supervisorName: {
      type: String,
      required: [true, "Supervisor name is required"],
      trim: true,
    },
    supervisorEmail: {
      type: String,
      required: [true, "Supervisor email is required"],
      trim: true,
      lowercase: true,
    },

    // Internship duration
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    // Company letter file uploaded to Cloudinary
    companyLetterUrl: {
      type: String,
      default: "",
    },

    // Admin verifies the placement (true = verified)
    verifiedByAdmin: {
      type: Boolean,
      default: false,
    },

    // Overall placement status
    // pending   = submitted, waiting for admin
    // active    = verified and ongoing
    // completed = internship finished
    // rejected  = admin rejected
    status: {
      type: String,
      enum: ["pending", "active", "completed", "rejected"],
      default: "pending",
    },

    // Placement status timeline steps
    // This tracks which stage the placement is at
    timelineStatus: {
      type: String,
      enum: ["submitted", "verified", "active", "completed"],
      default: "submitted",
    },

    // Mid-term milestone status
    midTermStatus: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },

    // Final milestone status
    finalStatus: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model("Placement", placementSchema);