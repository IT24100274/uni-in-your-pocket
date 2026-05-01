const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Please add content"],
    },
    type: {
      type: String,
      enum: ["notice", "event"],
      default: "notice",
    },
    // Target audience by role (empty array = all roles)
    targetRoles: {
      type: [String],
      enum: ["student", "lecturer", "admin", "student_representative"],
      default: [],
    },
    // Target audience by department (empty array = all departments)
    targetDepartments: {
      type: [String],
      default: [],
    },
    // For events only
    eventDate: {
      type: Date,
      default: null,
    },
    eventLocation: {
      type: String,
      trim: true,
      default: null,
    },
    // File attachments (images / PDFs uploaded to Cloudinary)
    attachments: [
      {
        url:          { type: String },
        originalName: { type: String },
        fileType:     { type: String }, // 'image' | 'pdf'
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notice", noticeSchema);