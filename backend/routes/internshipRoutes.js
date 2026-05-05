const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createInternship,
  getMyInternship,
  updateInternship,
  deleteInternship,
  deleteInternshipById,
  getAllInternships,
  verifyInternship,
  updateMilestone,
  getRiskFlags,
  submitLog,
  getMyLogs,
  deleteLog,
  getLogById,
  getAllLogs,
  reviewLog,
  getProgressStats,
  getSupervisors,
  assignSupervisor,
  removeSupervisor,
} = require("../controllers/InternshipController");

/*
 * Internship Tracker Routes
 * All routes are JWT protected using the protect middleware.
 * Role based access is enforced using the authorize middleware.
 * Students manage their own placement and weekly logs.
 * Lecturers view and review all student logs.
 * Admins verify placements and access risk flag reports.
 * File uploads use Multer + Cloudinary via the upload middleware.
 */

// Placement routes
router.post("/", protect, authorize("student"), upload.single("companyLetter"), createInternship);
router.get("/my", protect, authorize("student"), getMyInternship);
router.patch("/my", protect, authorize("student"), upload.single("companyLetter"), updateInternship);
router.delete("/my", protect, authorize("student"), deleteInternship);
router.delete("/:id", protect, authorize("admin"), deleteInternshipById);
router.patch("/:id/verify", protect, authorize("admin"), verifyInternship);
router.patch("/milestone", protect, authorize("student"), updateMilestone);

// Admin & Lecturer routes
router.get("/admin/all", protect, authorize("admin", "lecturer"), getAllInternships);
router.get("/admin/risks", protect, authorize("admin"), getRiskFlags);

// Weekly log routes
router.post("/logs", protect, authorize("student"), upload.single("evidence"), submitLog);
router.get("/logs/my", protect, authorize("student"), getMyLogs);
router.get("/logs/all", protect, authorize("lecturer", "admin"), getAllLogs);
router.get("/logs/:id", protect, getLogById);
router.patch("/logs/:id/review", protect, authorize("lecturer", "admin"), reviewLog);
router.delete("/logs/:id", protect, authorize("student"), deleteLog);

// Progress stats route
 router.get("/progress/my", protect, authorize("student"), getProgressStats);

// Supervisor management routes
router.get("/supervisors", protect, getSupervisors);
router.post("/supervisors/:lecturerId", protect, authorize("admin"), assignSupervisor);
router.delete("/supervisors/:lecturerId", protect, authorize("admin"), removeSupervisor);

// Lecturers list for search (all lecturers — admin use)
router.get("/lecturers", protect, authorize("admin", "student"), async (req, res) => {
  try {
    const User = require("../models/User");
    const lecturers = await User.find({ role: "lecturer" }).select("_id name email department");
    res.status(200).json({ lecturers });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
