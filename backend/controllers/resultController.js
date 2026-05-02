const Result = require("../models/Result");
const { uploadToCloudinary } = require("../config/cloudinary");

const calculateGrade = (marks) => {
  if (marks >= 75) return "A";
  if (marks >= 65) return "B";
  if (marks >= 55) return "C";
  if (marks >= 45) return "D";
  return "F";
};

const createResult = async (req, res) => {
  try {
    const { student, course, marks, remarks } = req.body;

    const existing = await Result.findOne({ student, course });
    if (existing) {
      return res.status(400).json({ message: "Result already exists for this student in this course" });
    }

    const result = await Result.create({
      student,
      course,
      marks,
      remarks,
      grade: calculateGrade(marks),
      enteredBy: req.user._id,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourseResults = async (req, res) => {
  try {
    const results = await Result.find({ course: req.params.courseId })
      .populate("student", "name email studentId")
      .populate("course", "title courseCode");

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({
      student: req.user._id,
      isPublished: true,
    }).populate("course", "title courseCode");

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    if (result.isLocked) {
      return res.status(403).json({ message: "Result is locked by admin and cannot be edited" });
    }

    const { marks, remarks } = req.body;
    result.marks = marks ?? result.marks;
    result.grade = calculateGrade(result.marks);
    result.remarks = remarks ?? result.remarks;

    await result.save();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    if (result.isLocked) {
      return res.status(403).json({ message: "Result is locked by admin and cannot be deleted" });
    }

    await Result.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Result deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const togglePublish = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    if (result.isLocked) {
      return res.status(403).json({ message: "Result is locked and cannot be changed" });
    }

    result.isPublished = !result.isPublished;
    await result.save();

    res.status(200).json({
      message: result.isPublished ? "Result published" : "Result unpublished",
      result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleLock = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    result.isLocked = !result.isLocked;
    result.lockedBy = result.isLocked ? req.user._id : null;

    await result.save();

    res.status(200).json({
      message: result.isLocked ? "Result locked" : "Result unlocked",
      result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate("student", "name email studentId")
      .populate("course", "title courseCode")
      .populate("enteredBy", "name");

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadFeedbackFile = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const uploaded = await uploadToCloudinary(
      req.file.buffer,
      "results_concerns",
      "raw"
    );

    result.feedbackFile = {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    };

    await result.save();
    res.status(200).json({ message: "Concern file uploaded successfully", result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createResult,
  getCourseResults,
  getMyResults,
  updateResult,
  deleteResult,
  togglePublish,
  toggleLock,
  exportResults,
  uploadFeedbackFile,
};