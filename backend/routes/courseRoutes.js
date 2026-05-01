const express = require("express");
const router = express.Router();

// Import our controller functions
const {
  createCourse,
  getAllCourses,
  getSingleCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
  toggleCourse,
} = require("../controllers/courseController");

// Import auth middleware
// protect   → checks if user is logged in (JWT)
// authorize → checks if user has the right role
const { protect, authorize } = require("../middleware/authMiddleware");

// Import upload from cloudinary config (for file uploads)
const { upload } = require("../config/cloudinary");

// =============================================
// COURSE ROUTES
// =============================================

// GET  /api/courses  → get all courses (everyone logged in)
// POST /api/courses  → create a course (lecturer and admin only)
router
  .route("/")
  .get(protect, getAllCourses)
  .post(
    protect,
    authorize("lecturer", "admin"),
    // Handle 2 file fields: syllabus (PDF) and banner (image)
    upload.fields([
      { name: "syllabus", maxCount: 1 },
      { name: "banner", maxCount: 1 },
    ]),
    createCourse
  );

// GET /api/courses/my-courses → lecturer sees only their own courses
router.get(
  "/my-courses",
  protect,
  authorize("lecturer"),
  getMyCourses
);

// GET    /api/courses/:id  → get one course (everyone logged in)
// PUT    /api/courses/:id  → update a course (lecturer who owns it, admin)
// DELETE /api/courses/:id  → delete a course (lecturer who owns it, admin)
router
  .route("/:id")
  .get(protect, getSingleCourse)
  .put(
    protect,
    authorize("lecturer", "admin"),
    upload.fields([
      { name: "syllabus", maxCount: 1 },
      { name: "banner", maxCount: 1 },
    ]),
    updateCourse
  )
  .delete(protect, authorize("lecturer", "admin"), deleteCourse);

// PATCH /api/courses/:id/toggle → activate or deactivate a course
router.patch(
  "/:id/toggle",
  protect,
  authorize("lecturer", "admin"),
  toggleCourse
);

module.exports = router;