const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const { upload, uploadToCloudinary } = require("../config/cloudinary");

// =============================================
// CREATE ASSIGNMENT (Lecturer only)
// POST /api/assignments
// =============================================
const createAssignment = async (req, res) => {
  try {
    const { title, description, courseId, deadline } = req.body;

    if (!title || !description || !courseId || !deadline) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Upload brief file to Cloudinary if provided
    let briefUrl = null;
    if (req.file) {
     const result = await uploadToCloudinary(req.file.buffer, "assignments/briefs", "raw");
      briefUrl = result.secure_url;
    }

    const assignment = await Assignment.create({
      title,
      description,
      courseId,
      deadline,
      briefUrl,
      createdBy: req.user._id,
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// GET ALL ASSIGNMENTS (All roles)
// GET /api/assignments
// =============================================
const getAssignments = async (req, res) => {
  try {
    let query = {};

    // Students only see published assignments
    if (req.user.role === "student" || req.user.role === "student_representative") {
      query.isPublished = true;
    }

    const assignments = await Assignment.find(query)
      .populate("courseId", "title courseCode")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// GET SINGLE ASSIGNMENT (All roles)
// GET /api/assignments/:id
// =============================================
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("courseId", "title courseCode")
      .populate("createdBy", "name");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// UPDATE ASSIGNMENT (Lecturer only)
// PUT /api/assignments/:id
// =============================================
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Only the lecturer who created it can edit (unless admin)
    if (
      assignment.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized to edit this assignment" });
    }

    const { title, description, deadline } = req.body;

    // Upload new brief if provided
    let briefUrl = assignment.briefUrl;
    if (req.file) {
     const result = await uploadToCloudinary(req.file.buffer, "assignments/briefs", "raw");
      briefUrl = result.secure_url;
    }

    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.deadline = deadline || assignment.deadline;
    assignment.briefUrl = briefUrl;

    await assignment.save();

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// PUBLISH / UNPUBLISH ASSIGNMENT (Lecturer only)
// PUT /api/assignments/:id/publish
// =============================================
const togglePublish = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (
      assignment.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Toggle between published and unpublished
    assignment.isPublished = !assignment.isPublished;
    await assignment.save();

    res.json({
      message: assignment.isPublished ? "Assignment published" : "Assignment unpublished",
      isPublished: assignment.isPublished,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// DELETE ASSIGNMENT (Lecturer/Admin only)
// DELETE /api/assignments/:id
// =============================================
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (
      assignment.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    // Also delete all submissions for this assignment
    await Submission.deleteMany({ assignmentId: req.params.id });

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// SUBMIT ASSIGNMENT (Student only)
// POST /api/assignments/:id/submit
// =============================================
const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!assignment.isPublished) {
      return res.status(400).json({ message: "Assignment is not published yet" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    // Check if student already submitted
    const existing = await Submission.findOne({
      assignmentId: req.params.id,
      studentId: req.user._id,
    });

    if (existing) {
      return res.status(400).json({ message: "You already submitted. Use resubmit instead." });
    }

    // Auto calculate if late
    const isLate = new Date() > new Date(assignment.deadline);

    // Upload file to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, "assignments/submissions", "raw");


    const submission = await Submission.create({
      assignmentId: req.params.id,
      studentId: req.user._id,
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      submittedAt: new Date(),
      isLate,
      status: "submitted",
    });

    res.status(201).json({
      message: isLate ? "Submitted (marked as late)" : "Submitted on time!",
      submission,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// RESUBMIT ASSIGNMENT (Student only)
// PUT /api/assignments/:id/resubmit
// =============================================
const resubmitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Cannot resubmit after deadline
    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ message: "Deadline has passed. Cannot resubmit." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const existing = await Submission.findOne({
      assignmentId: req.params.id,
      studentId: req.user._id,
    });

    if (!existing) {
      return res.status(404).json({ message: "No submission found. Submit first." });
    }

    // Upload new file to Cloudinary
   const result = await uploadToCloudinary(req.file.buffer, "assignments/submissions", "raw");

    existing.fileUrl = result.secure_url;
    existing.fileName = req.file.originalname;
    existing.submittedAt = new Date();
    existing.isLate = false; // resubmit is only allowed before deadline
    existing.status = "resubmitted";

    await existing.save();

    res.json({ message: "Resubmitted successfully!", submission: existing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// GET ALL SUBMISSIONS FOR AN ASSIGNMENT (Lecturer/Admin)
// GET /api/assignments/:id/submissions
// =============================================
const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignmentId: req.params.id })
      .populate("studentId", "name email studentId")
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// GET MY SUBMISSION for an assignment (Student)
// GET /api/assignments/:id/my-submission
// =============================================
const getMySubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      assignmentId: req.params.id,
      studentId: req.user._id,
    });

    if (!submission) {
      return res.status(404).json({ message: "No submission found" });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  togglePublish,
  deleteAssignment,
  submitAssignment,
  resubmitAssignment,
  getSubmissions,
  getMySubmission,
};