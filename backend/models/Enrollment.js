const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    // The student who is requesting enrollment
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The course they want to enroll in
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // Status of the enrollment request
    status: {
      type: String,
      enum: ["pending", "approved", "denied"],
      default: "pending",
    },

    // Which semester the student is enrolling for
    // Example: "Y2S1"
    semester: {
      type: String,
      required: true,
    },

    // Note about whether the student is eligible or not
    // Example: "CS101: 72% — eligible" or "New Y1S1 student — auto eligible"
    eligibilityNote: {
      type: String,
      default: null,
    },

    // Reason given when enrollment is denied
    denialReason: {
      type: String,
      default: null,
    },

    // The lecturer or admin who approved or denied the request
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // When the request was reviewed
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  }
);

// This prevents a student from enrolling in the same course twice
// It creates a unique combination of student + course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);