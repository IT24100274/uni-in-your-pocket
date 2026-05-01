const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    // Assignment title - e.g. "Lab Report 01"
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Detailed description of what students need to do
    description: {
      type: String,
      required: true,
    },

    // Which course this assignment belongs to (links to M2's Course model)
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // Deadline for submission
    deadline: {
      type: Date,
      required: true,
    },

    // The brief/rubric file uploaded by lecturer (stored on Cloudinary)
    briefUrl: {
      type: String,
      default: null,
    },

    // Is this assignment visible to students?
    // false = draft, true = published
    isPublished: {
      type: Boolean,
      default: false,
    },

    // Which lecturer created this assignment (links to User model)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model("Assignment", assignmentSchema);