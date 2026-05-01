const express = require("express");
const router = express.Router();

const {
  requestEnrollment,
  getMyEnrollments,
  getCourseEnrollments,
  getPendingEnrollments,
  approveEnrollment,
  denyEnrollment,
  overrideEnrollment,
  bulkApprove,
  bulkDeny,
  getEnrolledStudents,
  unenrollCourse,
} = require("../controllers/enrollmentController");

const { protect, authorize } = require("../middleware/authMiddleware");

// POST /api/enrollments         → student requests enrollment
// GET  /api/enrollments/my      → student sees their own enrollments
router
  .route("/")
  .post(protect, authorize("student"), requestEnrollment);

router.get("/my", protect, authorize("student"), getMyEnrollments);

// GET /api/enrollments/pending  → lecturer/admin sees all pending
router.get(
  "/pending",
  protect,
  authorize("lecturer", "admin"),
  getPendingEnrollments
);

// POST /api/enrollments/bulk-approve → approve many at once
// POST /api/enrollments/bulk-deny    → deny many at once
router.post(
  "/bulk-approve",
  protect,
  authorize("lecturer", "admin"),
  bulkApprove
);
router.post(
  "/bulk-deny",
  protect,
  authorize("lecturer", "admin"),
  bulkDeny
);

// GET /api/enrollments/course/:courseId          → all enrollments for a course
// GET /api/enrollments/course/:courseId/students → only approved students
router.get(
  "/course/:courseId",
  protect,
  authorize("lecturer", "admin"),
  getCourseEnrollments
);
router.get(
  "/course/:courseId/students",
  protect,
  authorize("lecturer", "admin"),
  getEnrolledStudents
);

// PATCH /api/enrollments/:id/approve  → approve one
// PATCH /api/enrollments/:id/deny     → deny one
// PATCH /api/enrollments/:id/override → admin force approve
router.patch(
  "/:id/approve",
  protect,
  authorize("lecturer", "admin"),
  approveEnrollment
);
router.patch(
  "/:id/deny",
  protect,
  authorize("lecturer", "admin"),
  denyEnrollment
);
router.patch(
  "/:id/override",
  protect,
  authorize("admin"),
  overrideEnrollment
);

// DELETE /api/enrollments/:id/unenroll → student cancels their enrollment
router.delete(
  "/:id/unenroll",
  protect,
  authorize("student"),
  unenrollCourse
);

module.exports = router;