const Ticket = require("../models/Ticket");
const User = require("../models/User");

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private (student, student_representative)
const createTicket = async (req, res) => {
  try {
    const { title, description, category, priority, raisedFor } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "Please provide title, description and category" });
    }

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

// @desc    Get all tickets raised by the logged-in user
// @route   GET /api/tickets/my
// @access  Private (student, student_representative)
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ raisedBy: req.user._id })
      .populate("raisedFor", "name email studentId")
      .populate("respondedBy", "name role")
      .populate("forwardedTo", "name role")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all tickets in the system
// @route   GET /api/tickets/all
// @access  Private (admin, student_representative)
const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("raisedBy", "name email studentId role")
      .populate("raisedFor", "name email studentId")
      .populate("respondedBy", "name role")
      .populate("forwardedTo", "name role")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get tickets forwarded to the logged-in user
// @route   GET /api/tickets/forwarded
// @access  Private (lecturer, admin)
const getForwardedTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ forwardedTo: req.user._id })
      .populate("raisedBy", "name email studentId role")
      .populate("raisedFor", "name email studentId")
      .populate("respondedBy", "name role")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get a single ticket by ID
// @route   GET /api/tickets/:id
// @access  Private (own ticket, or admin/rep/lecturer)
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("raisedBy", "name email studentId role")
      .populate("raisedFor", "name email studentId")
      .populate("respondedBy", "name role")
      .populate("forwardedTo", "name role department");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const isOwner = ticket.raisedBy._id.toString() === req.user._id.toString();
    const isPrivileged = ["admin", "student_representative", "lecturer"].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "Not authorized to view this ticket" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Respond to a ticket and update its status
// @route   PUT /api/tickets/:id/respond
// @access  Private (admin, student_representative, lecturer)
const respondToTicket = async (req, res) => {
  try {
    const { response, status } = req.body;

    if (!response) {
      return res.status(400).json({ message: "Please provide a response" });
    }

    const allowedStatuses = ["in_progress", "resolved"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Status must be in_progress or resolved" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({ message: "Cannot respond to a closed ticket" });
    }

    ticket.response = response;
    ticket.respondedBy = req.user._id;
    ticket.respondedAt = new Date();
    ticket.status = status || "in_progress";

    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate("raisedBy", "name email")
      .populate("respondedBy", "name role");

    res.status(200).json({ message: "Response submitted successfully", ticket: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Forward a ticket to a lecturer or admin
// @route   PUT /api/tickets/:id/forward
// @access  Private (student_representative)
const forwardTicket = async (req, res) => {
  try {
    const { forwardedTo } = req.body;

    if (!forwardedTo) {
      return res.status(400).json({ message: "Please specify who to forward this ticket to" });
    }

    const targetUser = await User.findById(forwardedTo);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!["lecturer", "admin"].includes(targetUser.role)) {
      return res.status(400).json({ message: "Tickets can only be forwarded to a lecturer or admin" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({ message: "Cannot forward a closed ticket" });
    }

    ticket.forwardedTo = forwardedTo;
    ticket.forwardedAt = new Date();
    ticket.status = "forwarded";

    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate("raisedBy", "name email")
      .populate("forwardedTo", "name role department");

    res.status(200).json({ message: `Ticket forwarded to ${targetUser.name}`, ticket: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Close a ticket
// @route   PUT /api/tickets/:id/close
// @access  Private (all roles)
const closeTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const isOwner = ticket.raisedBy.toString() === req.user._id.toString();
    const isPrivileged = ["admin", "student_representative", "lecturer"].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "Not authorized to close this ticket" });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({ message: "Ticket is already closed" });
    }

    ticket.status = "closed";
    await ticket.save();

    res.status(200).json({ message: "Ticket closed successfully", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a ticket
// @route   DELETE /api/tickets/:id
// @access  Private (admin only)
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await Ticket.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  getForwardedTickets,
  getTicketById,
  respondToTicket,
  forwardTicket,
  closeTicket,
  deleteTicket,
};