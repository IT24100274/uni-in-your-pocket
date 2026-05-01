const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { uploadToCloudinary } = require("../config/cloudinary");

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private (student, student_representative)
const createTicket = async (req, res) => {
  try {
    console.log("[createTicket] === NEW TICKET REQUEST ===");
    console.log("[createTicket] User:", req.user._id, "| Role:", req.user.role);
    console.log("[createTicket] Body:", JSON.stringify(req.body));

    const { title, description, category, priority, raisedFor } = req.body;

    if (!title || !description || !category) {
      console.log("[createTicket] ERROR: Missing required fields");
      return res.status(400).json({ message: "Please provide title, description and category" });
    }

    if (raisedFor) {
      const targetStudent = await User.findById(raisedFor);
      if (!targetStudent) return res.status(404).json({ message: "Student not found" });
      if (targetStudent.role !== "student")
        return res.status(400).json({ message: "Can only raise a ticket on behalf of a student" });
    }

    let attachmentUrl = null;

    if (req.file) {
      const maxBytes = 5 * 1024 * 1024; // 5MB

      console.log("[createTicket] --- FILE RECEIVED ---");
      console.log("[createTicket] Original name:", req.file.originalname);
      console.log("[createTicket] MIME type:", req.file.mimetype);
      console.log("[createTicket] File size (bytes):", req.file.size);
      console.log("[createTicket] Buffer length:", req.file.buffer?.length);

      if (req.file.size > maxBytes) {
        console.log("[createTicket] ERROR: File too large");
        return res.status(400).json({ message: "Attachment too large. Max size is 5MB." });
      }

      if (!req.file.buffer || req.file.buffer.length === 0) {
        console.log("[createTicket] ERROR: File buffer is empty — frontend sent empty file!");
        return res.status(400).json({ message: "Uploaded file is empty. Please try selecting it again." });
      }

      console.log("[createTicket] Uploading to Cloudinary with resource_type: auto ...");

      // PDFs must use "raw" so Cloudinary stores them at /raw/upload/
      // Images use default (no third arg) → stored at /image/upload/
      // This is the team standard from M2 - Saifullah
      const isPdf = req.file.mimetype === "application/pdf";
      const resourceType = isPdf ? "raw" : undefined;
      console.log("[createTicket] isPdf:", isPdf, "| resourceType:", resourceType || "default (image)");

      const result = await uploadToCloudinary(
        req.file.buffer,
        "uni-pocket/tickets/attachments",
        resourceType
      );

      console.log("[createTicket] Cloudinary upload SUCCESS");
      console.log("[createTicket] Resource type stored as:", result.resource_type);
      console.log("[createTicket] Bytes stored on Cloudinary:", result.bytes);
      console.log("[createTicket] Secure URL:", result.secure_url);

      if (result.bytes === 0) {
        console.log("[createTicket] WARNING: Cloudinary stored 0 bytes!");
      }

      attachmentUrl = result.secure_url;
    } else {
      console.log("[createTicket] No file attached to this ticket");
    }

    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority: priority || "medium",
      raisedBy: req.user._id,
      raisedFor: raisedFor || null,
      attachmentUrl,
    });

    console.log("[createTicket] Ticket created with ID:", ticket._id);
    console.log("[createTicket] attachmentUrl saved:", attachmentUrl || "none");

    res.status(201).json({ message: "Ticket raised successfully", ticket });
  } catch (error) {
    console.log("[createTicket] CAUGHT ERROR:", error.message);
    console.log("[createTicket] Stack:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all tickets raised by the logged-in user
// @route   GET /api/tickets/my
// @access  Private (student, student_representative)
const getMyTickets = async (req, res) => {
  try {
    console.log("[getMyTickets] User:", req.user._id);
    const tickets = await Ticket.find({ raisedBy: req.user._id })
      .populate("raisedFor", "name email studentId")
      .populate("respondedBy", "name role")
      .populate("forwardedTo", "name role")
      .sort({ createdAt: -1 });
    console.log("[getMyTickets] Found", tickets.length, "ticket(s)");
    res.status(200).json(tickets);
  } catch (error) {
    console.log("[getMyTickets] ERROR:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all tickets in the system
// @route   GET /api/tickets/all
// @access  Private (admin, student_representative)
const getAllTickets = async (req, res) => {
  try {
    console.log("[getAllTickets] Requested by:", req.user._id, "| Role:", req.user.role);
    const tickets = await Ticket.find()
      .populate("raisedBy", "name email studentId role")
      .populate("raisedFor", "name email studentId")
      .populate("respondedBy", "name role")
      .populate("forwardedTo", "name role")
      .sort({ createdAt: -1 });
    console.log("[getAllTickets] Found", tickets.length, "total ticket(s)");
    res.status(200).json(tickets);
  } catch (error) {
    console.log("[getAllTickets] ERROR:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get tickets forwarded to the logged-in user
// @route   GET /api/tickets/forwarded
// @access  Private (lecturer, admin)
const getForwardedTickets = async (req, res) => {
  try {
    console.log("[getForwardedTickets] User:", req.user._id);
    const tickets = await Ticket.find({ forwardedTo: req.user._id })
      .populate("raisedBy", "name email studentId role")
      .populate("raisedFor", "name email studentId")
      .populate("respondedBy", "name role")
      .sort({ createdAt: -1 });
    console.log("[getForwardedTickets] Found", tickets.length, "forwarded ticket(s)");
    res.status(200).json(tickets);
  } catch (error) {
    console.log("[getForwardedTickets] ERROR:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get a single ticket by ID
// @route   GET /api/tickets/:id
// @access  Private (own ticket, or admin/rep/lecturer)
const getTicketById = async (req, res) => {
  try {
    console.log("[getTicketById] Looking up ticket ID:", req.params.id);
    const ticket = await Ticket.findById(req.params.id)
      .populate("raisedBy", "name email studentId role")
      .populate("raisedFor", "name email studentId")
      .populate("respondedBy", "name role")
      .populate("forwardedTo", "name role department");

    if (!ticket) {
      console.log("[getTicketById] Not found");
      return res.status(404).json({ message: "Ticket not found" });
    }

    const isOwner = ticket.raisedBy._id.toString() === req.user._id.toString();
    const isPrivileged = ["admin", "student_representative", "lecturer"].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      console.log("[getTicketById] DENIED — user is not owner or privileged");
      return res.status(403).json({ message: "Not authorized to view this ticket" });
    }

    console.log("[getTicketById] Returning ticket:", ticket.title, "| Status:", ticket.status);
    console.log("[getTicketById] attachmentUrl:", ticket.attachmentUrl || "none");
    res.status(200).json(ticket);
  } catch (error) {
    console.log("[getTicketById] ERROR:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Respond to a ticket and update its status
// @route   PUT /api/tickets/:id/respond
// @access  Private (admin, student_representative, lecturer)
const respondToTicket = async (req, res) => {
  try {
    console.log("[respondToTicket] Ticket:", req.params.id, "| By:", req.user._id);
    const { response, status } = req.body;

    if (!response) return res.status(400).json({ message: "Please provide a response" });

    const allowedStatuses = ["in_progress", "resolved"];
    if (status && !allowedStatuses.includes(status))
      return res.status(400).json({ message: "Status must be in_progress or resolved" });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    if (ticket.status === "closed")
      return res.status(400).json({ message: "Cannot respond to a closed ticket" });

    ticket.response = response;
    ticket.respondedBy = req.user._id;
    ticket.respondedAt = new Date();
    ticket.status = status || "in_progress";
    await ticket.save();

    console.log("[respondToTicket] Response saved | New status:", ticket.status);

    const updated = await Ticket.findById(ticket._id)
      .populate("raisedBy", "name email")
      .populate("respondedBy", "name role");

    res.status(200).json({ message: "Response submitted successfully", ticket: updated });
  } catch (error) {
    console.log("[respondToTicket] ERROR:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Forward a ticket to a lecturer or admin
// @route   PUT /api/tickets/:id/forward
// @access  Private (student_representative)
const forwardTicket = async (req, res) => {
  try {
    console.log("[forwardTicket] Ticket:", req.params.id, "| ForwardTo:", req.body.forwardedTo);
    const { forwardedTo } = req.body;
    if (!forwardedTo)
      return res.status(400).json({ message: "Please specify who to forward this ticket to" });

    const targetUser = await User.findById(forwardedTo);
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    if (!["lecturer", "admin"].includes(targetUser.role))
      return res.status(400).json({ message: "Tickets can only be forwarded to a lecturer or admin" });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    if (ticket.status === "closed")
      return res.status(400).json({ message: "Cannot forward a closed ticket" });

    ticket.forwardedTo = forwardedTo;
    ticket.forwardedAt = new Date();
    ticket.status = "forwarded";
    await ticket.save();

    console.log("[forwardTicket] Forwarded to:", targetUser.name, "(", targetUser.role, ")");

    const updated = await Ticket.findById(ticket._id)
      .populate("raisedBy", "name email")
      .populate("forwardedTo", "name role department");

    res.status(200).json({ message: `Ticket forwarded to ${targetUser.name}`, ticket: updated });
  } catch (error) {
    console.log("[forwardTicket] ERROR:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Close a ticket
// @route   PUT /api/tickets/:id/close
// @access  Private (all roles)
const closeTicket = async (req, res) => {
  try {
    console.log("[closeTicket] Ticket:", req.params.id, "| By:", req.user._id);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const isOwner = ticket.raisedBy.toString() === req.user._id.toString();
    const isPrivileged = ["admin", "student_representative", "lecturer"].includes(req.user.role);
    if (!isOwner && !isPrivileged)
      return res.status(403).json({ message: "Not authorized to close this ticket" });
    if (ticket.status === "closed")
      return res.status(400).json({ message: "Ticket is already closed" });

    ticket.status = "closed";
    await ticket.save();
    console.log("[closeTicket] Ticket closed");
    res.status(200).json({ message: "Ticket closed successfully", ticket });
  } catch (error) {
    console.log("[closeTicket] ERROR:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a ticket
// @route   DELETE /api/tickets/:id
// @access  Private (admin only)
const deleteTicket = async (req, res) => {
  try {
    console.log("[deleteTicket] Ticket:", req.params.id);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    await Ticket.findByIdAndDelete(req.params.id);
    console.log("[deleteTicket] Deleted");
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.log("[deleteTicket] ERROR:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all students (for rep raising on behalf of)
// @route   GET /api/tickets/students
// @access  Private (student_representative)
const getStudentsList = async (req, res) => {
  try {
    console.log("[getStudentsList] Requested by:", req.user._id);
    const students = await User.find({ role: "student", status: "approved" }).select("name email studentId");
    console.log("[getStudentsList] Found", students.length, "student(s)");
    res.status(200).json(students);
  } catch (error) {
    console.log("[getStudentsList] ERROR:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all lecturers and admins (for rep forwarding)
// @route   GET /api/tickets/staff
// @access  Private (student_representative)
const getStaffList = async (req, res) => {
  try {
    console.log("[getStaffList] Requested by:", req.user._id);
    const staff = await User.find({ role: { $in: ["lecturer", "admin"] }, status: "approved" }).select("name email role department");
    console.log("[getStaffList] Found", staff.length, "staff member(s)");
    res.status(200).json(staff);
  } catch (error) {
    console.log("[getStaffList] ERROR:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createTicket, getMyTickets, getAllTickets, getForwardedTickets,
  getTicketById, respondToTicket, forwardTicket, closeTicket, deleteTicket,
  getStudentsList, getStaffList,
};
