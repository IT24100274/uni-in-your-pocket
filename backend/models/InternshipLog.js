const mongoose = require("mongoose");

/*
 * InternshipLog Schema
 * Stores weekly progress logs submitted by students during their internship.
 * Each log belongs to a specific internship via internshipId.
 * Lecturers approve or reject logs and leave comments for students.
 * Evidence files are uploaded to Cloudinary via the upload middleware.
 * Status lifecycle: pending → approved / rejected.
 * Students can only delete logs that are still in pending status.
 */

const internshipLogSchema = new mongoose.Schema(
  {
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
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
    category: {
      type: String,
      enum: ["technical", "meeting", "training", "research", "other"],
      default: "technical",
    },
    evidenceUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    lecturerComment: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InternshipLog", internshipLogSchema);