const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
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
} = require("../controllers/assignmentController");

// All routes below require login
// protect = must be logged in
// authorize = must have correct role

// Get all assignments / Create assignment
router
  .route("/")
  .get(protect, getAssignments)
  .post(protect, authorize("lecturer", "admin"), upload.single("brief"), createAssignment);

// Get, update, delete single assignment
router
  .route("/:id")
  .get(protect, getAssignmentById)
  .put(protect, authorize("lecturer", "admin"), upload.single("brief"), updateAssignment)
  .delete(protect, authorize("lecturer", "admin"), deleteAssignment);

// Publish / unpublish
router.put("/:id/publish", protect, authorize("lecturer", "admin"), togglePublish);

// Student submit
router.post("/:id/submit", protect, authorize("student", "student_representative"), upload.single("file"), submitAssignment);

// Student resubmit
router.put("/:id/resubmit", protect, authorize("student", "student_representative"), upload.single("file"), resubmitAssignment);

// Lecturer views all submissions
router.get("/:id/submissions", protect, authorize("lecturer", "admin"), getSubmissions);

// Student views own submission
router.get("/:id/my-submission", protect, getMySubmission);

module.exports = router;