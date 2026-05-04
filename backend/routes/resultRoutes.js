const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const {
  createResult,
  getCourseResults,
  getMyResults,
  updateResult,
  deleteResult,
  togglePublish,
  toggleLock,
  exportResults,
  uploadFeedbackFile,
} = require("../controllers/resultController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("lecturer"), createResult);
router.get("/my", protect, authorize("student", "student_representative"), getMyResults);
router.get("/export", protect, authorize("admin"), exportResults);
router.get("/course/:courseId", protect, authorize("lecturer", "admin"), getCourseResults);
router.put("/:id", protect, authorize("lecturer"), updateResult);
router.delete("/:id", protect, authorize("lecturer"), deleteResult);
router.patch("/:id/publish", protect, authorize("lecturer"), togglePublish);
router.patch("/:id/lock", protect, authorize("admin"), toggleLock);
router.post("/:id/upload", protect, authorize("student", "student_representative"), upload.single("file"), uploadFeedbackFile);

module.exports = router;