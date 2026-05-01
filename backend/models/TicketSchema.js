const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    // What the ticket is about
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },

    // Category of the issue
    category: {
      type: String,
      enum: ["academic", "administrative", "course_related", "facility", "it_support", "other"],
      required: [true, "Please select a category"],
    },

    // How urgent is it
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // Lifecycle status of the ticket
    status: {
      type: String,
      enum: ["open", "forwarded", "in_progress", "resolved", "closed"],
      default: "open",
    },

    // The student or rep who submitted this ticket
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

    // The admin/rep/lecturer who responded
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

    // Who the rep forwarded this ticket to (lecturer or admin)
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
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);