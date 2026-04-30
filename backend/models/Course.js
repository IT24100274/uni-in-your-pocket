const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    // Basic course information
    courseCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
    },

    // Which year and semester this course belongs to
    academicYear: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
    },
    academicSemester: {
      type: Number,
      enum: [1, 2],
      required: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    // The lecturer who owns this course
    // ref: "User" means it links to the User model
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // File URLs stored on Cloudinary
    syllabusUrl: {
      type: String,
      default: null,
    },
    bannerUrl: {
      type: String,
      default: null,
    },

    // Eligibility rule for enrollment
    // Example: "Must have passed CS101 with minimum 50%"
    eligibilityNote: {
      type: String,
      default: "No prerequisites",
    },

    // Active means students can see and enroll
    // Inactive means the course is hidden from students
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // This automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

module.exports = mongoose.model("Course", courseSchema);