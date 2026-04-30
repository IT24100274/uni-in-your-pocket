const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");

// =============================================
// REQUEST ENROLLMENT
// Who can use: student only
// =============================================
const requestEnrollment = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the course is active
    if (!course.isActive) {
      return res
        .status(400)
        .json({ message: "This course is not available for enrollment" });
    }

    // Check if the student already applied for this course
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId,
    });
    if (existingEnrollment) {
      return res
        .status(400)
        .json({ message: "You have already applied for this course" });
    }

    // Get the student's details to check eligibility
    const student = await User.findById(req.user.id);

    // Build the semester string example: "Y2S1"
    const semester = `Y${student.academicYear}S${student.academicSemester}`;

    // ---- ELIGIBILITY CHECK ----
    // If the student is Year 1 Semester 1, they are auto eligible
    // because they have not done any exams yet
    let eligibilityNote = "";

    if (student.academicYear === 1 && student.academicSemester === 1) {
      eligibilityNote = "New Y1S1 student — auto eligible";
    } else {
      // For other students, we just note the course requirement
      // Later M4 (Results module) can be connected here for real marks check
      eligibilityNote = course.eligibilityNote || "No prerequisites";
    }

    // Create the enrollment request
    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: courseId,
      semester,
      eligibilityNote,
    });

    res.status(201).json({
      message: "Enrollment request submitted successfully",
      enrollment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// GET MY ENROLLMENTS
// Who can use: student only
// Shows all enrollment requests the student made
// =============================================
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate("course", "courseCode title academicYear academicSemester department")
      .sort({ createdAt: -1 });

    res.status(200).json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// GET ALL ENROLLMENTS FOR A COURSE
// Who can use: lecturer (own course), admin
// =============================================
const getCourseEnrollments = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Lecturer can only see enrollments for their own courses
    if (
      req.user.role === "lecturer" &&
      course.lecturer.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "You can only view enrollments for your own courses" });
    }

    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate("student", "name email studentId academicYear academicSemester")
      .sort({ createdAt: -1 });

    res.status(200).json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// GET ALL PENDING ENROLLMENTS
// Who can use: lecturer (own courses), admin
// =============================================
const getPendingEnrollments = async (req, res) => {
  try {
    let filter = { status: "pending" };

    // If lecturer, only show pending for their courses
    if (req.user.role === "lecturer") {
      // Find all courses that belong to this lecturer
      const myCourses = await Course.find({ lecturer: req.user.id });
      const myCourseIds = myCourses.map((c) => c._id);
      filter.course = { $in: myCourseIds };
    }

    const enrollments = await Enrollment.find(filter)
      .populate("student", "name email studentId academicYear academicSemester")
      .populate("course", "courseCode title")
      .sort({ createdAt: -1 });

    res.status(200).json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// APPROVE ENROLLMENT
// Who can use: lecturer (own course), admin
// =============================================
const approveEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate(
      "course"
    );

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Lecturer can only approve for their own courses
    if (
      req.user.role === "lecturer" &&
      enrollment.course.lecturer.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update the enrollment status
    enrollment.status = "approved";
    enrollment.reviewedBy = req.user.id;
    enrollment.reviewedAt = new Date();
    await enrollment.save();

    res.status(200).json({
      message: "Enrollment approved",
      enrollment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// DENY ENROLLMENT
// Who can use: lecturer (own course), admin
// =============================================
const denyEnrollment = async (req, res) => {
  try {
    const { denialReason } = req.body;

    const enrollment = await Enrollment.findById(req.params.id).populate(
      "course"
    );

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Lecturer can only deny for their own courses
    if (
      req.user.role === "lecturer" &&
      enrollment.course.lecturer.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update the enrollment status
    enrollment.status = "denied";
    enrollment.denialReason = denialReason || "No reason provided";
    enrollment.reviewedBy = req.user.id;
    enrollment.reviewedAt = new Date();
    await enrollment.save();

    res.status(200).json({
      message: "Enrollment denied",
      enrollment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// ADMIN OVERRIDE — force approve any enrollment
// Who can use: admin only
// Used when student fails eligibility but admin
// wants to approve them anyway
// =============================================
const overrideEnrollment = async (req, res) => {
  try {
    const { overrideNote } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Force approve and record who did it and why
    enrollment.status = "approved";
    enrollment.eligibilityNote =
      `ADMIN OVERRIDE by ${req.user.id}: ` +
      (overrideNote || "Approved by admin");
    enrollment.reviewedBy = req.user.id;
    enrollment.reviewedAt = new Date();
    await enrollment.save();

    res.status(200).json({
      message: "Enrollment approved by admin override",
      enrollment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// BULK APPROVE — approve multiple at once
// Who can use: lecturer (own courses), admin
// =============================================
const bulkApprove = async (req, res) => {
  try {
    // enrollmentIds is an array of IDs sent from the frontend
    const { enrollmentIds } = req.body;

    if (!enrollmentIds || enrollmentIds.length === 0) {
      return res.status(400).json({ message: "No enrollment IDs provided" });
    }

    // Update all enrollments in the array at once
    await Enrollment.updateMany(
      { _id: { $in: enrollmentIds } },
      {
        status: "approved",
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      }
    );

    res.status(200).json({
      message: `${enrollmentIds.length} enrollments approved successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// BULK DENY — deny multiple at once
// Who can use: lecturer (own courses), admin
// =============================================
const bulkDeny = async (req, res) => {
  try {
    const { enrollmentIds, denialReason } = req.body;

    if (!enrollmentIds || enrollmentIds.length === 0) {
      return res.status(400).json({ message: "No enrollment IDs provided" });
    }

    // Update all enrollments in the array at once
    await Enrollment.updateMany(
      { _id: { $in: enrollmentIds } },
      {
        status: "denied",
        denialReason: denialReason || "Denied by bulk action",
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      }
    );

    res.status(200).json({
      message: `${enrollmentIds.length} enrollments denied successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// GET ENROLLED STUDENTS FOR A COURSE
// Who can use: lecturer (own course), admin
// =============================================
const getEnrolledStudents = async (req, res) => {
  try {
    // Only get approved enrollments
    const enrollments = await Enrollment.find({
      course: req.params.courseId,
      status: "approved",
    }).populate("student", "name email studentId department");

    res.status(200).json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export all functions
module.exports = {
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
};