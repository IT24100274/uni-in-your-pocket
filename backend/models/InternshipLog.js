const mongoose = require("mongoose");

/*
 * WeeklyLog Schema
 * ----------------
 * This model stores the weekly progress logs submitted by students during their internship.
 * Each log belongs to a specific placement and tracks what the student did that week.
 * Lecturers can approve or reject each log and leave comments.
 * Students can upload evidence files (timesheets, photos, PDFs) via Cloudinary.
 * The status field controls the review lifecycle: pending → approved / rejected.
 */
const weeklyLogSchema = new mongoose.Schema(
  {
    placementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Placement",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    weekNumber: {
      type: Number,
      required: [true, "Week number is required"],
      min: 1,
      max: 52,
    },

    logDate: {
      type: Date,
      required: [true, "Log date is required"],
    },

    logDescription: {
      type: String,
      required: [true, "Log description is required"],
      trim: true,
    },

    tasksCompleted: {
      type: String,
      required: [true, "Tasks completed is required"],
      trim: true,
    },

    // Category tag selected by the student for this week's work
    category: {
      type: String,
      enum: ["technical", "meeting", "training", "research", "other"],
      default: "technical",
    },

    // Evidence file uploaded to Cloudinary (timesheet, photo, PDF)
    evidenceUrl: {
      type: String,
      default: "",
    },

    // Review lifecycle: pending → approved or rejected by lecturer
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Lecturer's comment when approving or rejecting the log
    lecturerComment: {
      type: String,
      default: "",
    },

    // Reference to the lecturer who reviewed this log
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Date and time when the lecturer reviewed this log
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WeeklyLog", weeklyLogSchema);