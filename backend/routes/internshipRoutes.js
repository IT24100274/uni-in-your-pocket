const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createInternship,
  getMyInternship,
  updateInternship,
  deleteInternship,
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
router.patch("/:id/verify", protect, authorize("admin"), verifyInternship);
router.patch("/milestone", protect, authorize("student"), updateMilestone);

// Admin routes
router.get("/admin/all", protect, authorize("admin"), getAllInternships);
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

module.exports = router;