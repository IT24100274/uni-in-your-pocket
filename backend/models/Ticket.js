const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    category: {
      type: String,
      enum: ["academic", "administrative", "course_related", "facility", "it_support", "other"],
      required: [true, "Please select a category"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "forwarded", "in_progress", "resolved", "closed"],
      default: "open",
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional: rep raised this on behalf of another student
    raisedFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Optional: one attachment (image or PDF) uploaded to Cloudinary
    attachmentUrl: {
      type: String,
      default: null,
    },
    response: {
      type: String,
      default: null,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    forwardedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    forwardedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);