const mongoose = require("mongoose");

/*
 * Internship Schema
 * Stores internship placement details for each student.
 * Students create one placement record with company, supervisor, and date info.
 * Admins verify placements and lecturers review weekly logs.
 * courseId links this placement to a specific course from the Course module (M2).
 * Milestones track mid-term and final progress within the placement.
 * timelineStatus tracks the overall placement journey from submitted to completed.
 */

const internshipSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
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
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    companyLetterUrl: {
      type: String,
      default: "",
    },
    verifiedByAdmin: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "rejected"],
      default: "pending",
    },
    timelineStatus: {
      type: String,
      enum: ["submitted", "verified", "active", "completed"],
      default: "submitted",
    },
    midTermStatus: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },
    finalStatus: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Internship", internshipSchema);