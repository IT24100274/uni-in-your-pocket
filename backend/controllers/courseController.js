const Course = require("../models/Course");
const { uploadToCloudinary } = require("../config/cloudinary");

// =============================================
// CREATE A NEW COURSE
// Who can use: lecturer, admin
// =============================================
const createCourse = async (req, res) => {
  try {
    const {
      courseCode,
      title,
      description,
      credits,
      academicYear,
      academicSemester,
      department,
      eligibilityNote,
    } = req.body;

    // Check if a course with this code already exists
    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({ message: "Course code already exists" });
    }

    // Upload files to Cloudinary if they were provided
    // req.files.syllabus[0].buffer is the file data stored in memory by multer
    let syllabusUrl = null;
    let bannerUrl = null;

    if (req.files && req.files.syllabus) {
      const result = await uploadToCloudinary(
        req.files.syllabus[0].buffer,
        "uni-pocket/courses/syllabus"
      );
      syllabusUrl = result.secure_url;
    }
    if (req.files && req.files.banner) {
      const result = await uploadToCloudinary(
        req.files.banner[0].buffer,
        "uni-pocket/courses/banners"
      );
      bannerUrl = result.secure_url;
    }

    // Create the new course in the database
    // req.user.id is the logged-in lecturer's ID (comes from auth middleware)
    const course = await Course.create({
      courseCode,
      title,
      description,
      credits,
      academicYear,
      academicSemester,
      department,
      eligibilityNote,
      syllabusUrl,
      bannerUrl,
      lecturer: req.user.id,
    });

    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// GET ALL COURSES
// Who can use: everyone (all logged in users)
// Order: Y1S1 first, then Y1S2 ... up to Y4S2
// =============================================
const getAllCourses = async (req, res) => {
  try {
    // Only show active courses to students
    // Lecturers and admins can see all courses including inactive ones
    let filter = {};
    if (
      req.user.role === "student" ||
      req.user.role === "student_representative"
    ) {
      filter.isActive = true;
    }

    // Sort by academicYear first, then academicSemester
    // This gives the order: Y1S1, Y1S2, Y2S1, Y2S2 ... Y4S2
    // populate() replaces the lecturer ID with their actual name and email
    const courses = await Course.find(filter)
      .populate("lecturer", "name email")
      .sort({ academicYear: 1, academicSemester: 1 });

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// GET A SINGLE COURSE BY ID
// Who can use: everyone (all logged in users)
// =============================================
const getSingleCourse = async (req, res) => {
  try {
    // req.params.id is the course ID from the URL
    const course = await Course.findById(req.params.id).populate(
      "lecturer",
      "name email"
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// UPDATE A COURSE
// Who can use: the lecturer who owns it, admin
// =============================================
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check ownership — only the lecturer who created it can edit
    // Admin can edit any course
    if (
      req.user.role === "lecturer" &&
      course.lecturer.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "You can only edit your own courses" });
    }

    // If new files are uploaded, upload to Cloudinary and update the URLs
    if (req.files && req.files.syllabus) {
      const result = await uploadToCloudinary(
        req.files.syllabus[0].buffer,
        "uni-pocket/courses/syllabus"
      );
      req.body.syllabusUrl = result.secure_url;
    }
    if (req.files && req.files.banner) {
      const result = await uploadToCloudinary(
        req.files.banner[0].buffer,
        "uni-pocket/courses/banners"
      );
      req.body.bannerUrl = result.secure_url;
    }

    // Update the course with new data
    // { new: true } means return the updated version not the old one
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// DELETE A COURSE
// Who can use: the lecturer who owns it, admin
// =============================================
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check ownership — only the lecturer who created it can delete
    // Admin can delete any course
    if (
      req.user.role === "lecturer" &&
      course.lecturer.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "You can only delete your own courses" });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// GET MY COURSES
// Who can use: lecturer only
// Returns only courses this lecturer created
// =============================================
const getMyCourses = async (req, res) => {
  try {
    // Find courses where lecturer field matches the logged-in user's ID
    const courses = await Course.find({ lecturer: req.user.id }).sort({
      academicYear: 1,
      academicSemester: 1,
    });

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// TOGGLE COURSE ACTIVE / INACTIVE
// Who can use: the lecturer who owns it, admin
// =============================================
const toggleCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check ownership
    if (
      req.user.role === "lecturer" &&
      course.lecturer.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "You can only toggle your own courses" });
    }

    // Flip the value — if true becomes false, if false becomes true
    course.isActive = !course.isActive;
    await course.save();

    res.status(200).json({
      message: `Course is now ${course.isActive ? "active" : "inactive"}`,
      isActive: course.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export all functions so routes can use them
module.exports = {
  createCourse,
  getAllCourses,
  getSingleCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
  toggleCourse,
};