const Ticket = require("../models/Ticket");
const User = require("../models/User");

// Create a new ticket
// route path   POST /api/tickets
// access by   student, student_representative
const createTicket = async (req, res) => {
  try {
    const { title, description, category, priority, raisedFor } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({ message: "Please provide title, description and category" });
    }

    // If rep is raising on behalf of someone, verify that person exists and is a student
    if (raisedFor) {
      const targetStudent = await User.findById(raisedFor);
      if (!targetStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (targetStudent.role !== "student") {
        return res.status(400).json({ message: "Can only raise a ticket on behalf of a student" });
      }
    }

    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority: priority || "medium",
      raisedBy: req.user._id,
      raisedFor: raisedFor || null,
    });

    res.status(201).json({ message: "Ticket raised successfully", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createTicket,
};