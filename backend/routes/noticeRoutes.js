const express = require("express");
const router = express.Router();
const {
  createNotice,
  getNotices,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} = require("../controllers/noticeController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

// All routes require login
router.use(protect);

// GET /api/notices         — filtered list for the current user
// POST /api/notices        — create (admin / lecturer / student_rep), supports file uploads
router
  .route("/")
  .get(getNotices)
  .post(
    authorize("admin", "lecturer", "student_representative"),
    upload.array("attachments", 5),  // max 5 files per notice
    createNotice
  );

// GET /api/notices/all     — unfiltered list (admin only)
router.get("/all", authorize("admin"), getAllNotices);

// GET/PUT/DELETE /api/notices/:id
router
  .route("/:id")
  .get(getNoticeById)
  .put(
    authorize("admin", "lecturer", "student_representative"),
    upload.array("attachments", 5),
    updateNotice
  )
  .delete(
    authorize("admin", "lecturer", "student_representative"),
    deleteNotice
  );

module.exports = router;