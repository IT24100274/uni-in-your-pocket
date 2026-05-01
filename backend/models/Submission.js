const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    // Which assignment this submission belongs to
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    // Which student submitted this
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The file uploaded by student (stored on Cloudinary)
    fileUrl: {
      type: String,
      required: true,
    },

    // Original file name - so lecturer knows what file it is
    fileName: {
      type: String,
      required: true,
    },

    // When the student submitted
    submittedAt: {
      type: Date,
      default: Date.now,
    },

    // Auto calculated - was it submitted after the deadline?
    // true = late, false = on time
    isLate: {
      type: Boolean,
      default: false,
    },

    // submitted = first time, resubmitted = replaced file
    status: {
      type: String,
      enum: ["submitted", "resubmitted"],
      default: "submitted",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Submission", submissionSchema);