const Internship = require("../models/Internship");
const InternshipLog = require("../models/InternshipLog");
const { uploadToCloudinary } = require("../config/cloudinary");

/*
 * Internship Controller
 * Handles all business logic for the Internship Tracker module.
 * Covers placement CRUD with delete (pending only), milestone tracking,
 * admin verification, risk flag detection, weekly log submission and review,
 * log delete (pending only), progress stats, and reminder checks.
 * All routes are role-protected using the auth middleware.
 */

const uploadInternshipFile = async (file, folder) => {
  if (!file) return "";
  const originalName = file.originalname || file.name || "";
  const isPdf =
    file.mimetype === "application/pdf" ||
    originalName.toLowerCase().endsWith(".pdf");
  const resourceType = isPdf ? "raw" : "image";
  const buffer = file.buffer;
  if (!buffer) {
    throw new Error("Uploaded file buffer is missing");
  }
  const result = await uploadToCloudinary(buffer, folder, resourceType);
  return result.secure_url;
};

const createInternship = async (req, res) => {
  try {
    const existing = await Internship.findOne({ studentId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "You already have an internship" });
    }
    const { companyName, companyAddress, supervisorName, supervisorEmail, startDate, endDate, assignedLecturer } = req.body;
    const companyLetterUrl = req.file
      ? await uploadInternshipFile(req.file, "uni-pocket/internships/companyLetters")
      : "";
    const internship = await Internship.create({
      studentId: req.user._id,
      companyName,
      companyAddress,
      supervisorName,
      supervisorEmail,
      startDate,
      endDate,
      companyLetterUrl,
      assignedLecturer: assignedLecturer || null,
    });
    res.status(201).json({ message: "Internship created successfully", internship });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMyInternship = async (req, res) => {
  try {
     const internship = await Internship.findOne({ studentId: req.user._id })
       .populate("assignedLecturer", "name email department");
    if (!internship) {
      return res.status(404).json({ message: "No internship found" });
    }
    const start = new Date(internship.startDate);
    const end = new Date(internship.endDate);
    const today = new Date();
    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.round(totalDays / 7);
    const weeksDone = Math.round((today - start) / (1000 * 60 * 60 * 24 * 7));
    const weeksLeft = totalWeeks - weeksDone;
    const progressPercent = Math.min(Math.round((weeksDone / totalWeeks) * 100), 100);
    res.status(200).json({
      internship,
      duration: {
        totalDays,
        totalWeeks,
        weeksDone: weeksDone > 0 ? weeksDone : 0,
        weeksLeft: weeksLeft > 0 ? weeksLeft : 0,
        progressPercent,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateInternship = async (req, res) => {
  try {
    const internship = await Internship.findOne({ studentId: req.user._id });
    if (!internship) {
      return res.status(404).json({ message: "No internship found" });
    }
    if (internship.status !== "pending") {
      return res.status(400).json({ message: "Cannot update an internship that has already been verified" });
    }
    const { companyName, companyAddress, supervisorName, supervisorEmail, startDate, endDate, assignedLecturer } = req.body;
    if (companyName) internship.companyName = companyName;
    if (companyAddress) internship.companyAddress = companyAddress;
    if (supervisorName) internship.supervisorName = supervisorName;
    if (supervisorEmail) internship.supervisorEmail = supervisorEmail;
    if (startDate) internship.startDate = startDate;
    if (endDate) internship.endDate = endDate;
    if (req.file) {
      internship.companyLetterUrl = await uploadInternshipFile(req.file, "uni-pocket/internships/companyLetters");
    }
    if (assignedLecturer) internship.assignedLecturer = assignedLecturer;
    await internship.save();
    res.status(200).json({ message: "Internship updated successfully", internship });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteInternship = async (req, res) => {
  try {
    const internship = await Internship.findOne({ studentId: req.user._id });
    if (!internship) {
      return res.status(404).json({ message: "No internship found" });
    }
    if (internship.status !== "pending") {
      return res.status(400).json({ message: "Cannot delete an internship that has already been verified" });
    }
    await InternshipLog.deleteMany({ internshipId: internship._id });
    await Internship.findByIdAndDelete(internship._id);
    res.status(200).json({ message: "Internship and all related logs deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteInternshipById = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }
    await InternshipLog.deleteMany({ internshipId: internship._id });
    await Internship.findByIdAndDelete(internship._id);
    res.status(200).json({ message: "Internship deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllInternships = async (req, res) => {
  try {
    let internships;
    if (req.user.role === "lecturer") {
      internships = await Internship.find({ assignedLecturer: req.user._id })
        .populate("studentId", "name email studentId department")
        .populate("assignedLecturer", "name email department");
    } else {
      internships = await Internship.find()
        .populate("studentId", "name email studentId department")
        .populate("assignedLecturer", "name email department");
    }
    res.status(200).json({ count: internships.length, internships });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const verifyInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }
    internship.verifiedByAdmin = true;
    internship.status = "active";
    internship.timelineStatus = "active";
    await internship.save();
    res.status(200).json({ message: "Internship verified successfully", internship });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMilestone = async (req, res) => {
  try {
    const internship = await Internship.findOne({ studentId: req.user._id });
    if (!internship) {
      return res.status(404).json({ message: "No internship found" });
    }
    const { midTermStatus, finalStatus } = req.body;
    if (midTermStatus) internship.midTermStatus = midTermStatus;
    if (finalStatus) internship.finalStatus = finalStatus;
    await internship.save();
    res.status(200).json({ message: "Milestone updated successfully", internship });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getRiskFlags = async (req, res) => {
  try {
    const internships = await Internship.find().populate("studentId", "name email studentId");
    const riskList = [];
    for (const internship of internships) {
      const logs = await InternshipLog.find({ internshipId: internship._id }).sort({ weekNumber: 1 });
      const missingLetter = !internship.companyLetterUrl;
      let consecutiveMissing = 0;
      let maxConsecutive = 0;
      const today = new Date();
      const start = new Date(internship.startDate);
      const weeksPassed = Math.round((today - start) / (1000 * 60 * 60 * 24 * 7));
      for (let w = 1; w <= weeksPassed; w++) {
        const found = logs.find((l) => l.weekNumber === w);
        if (!found) {
          consecutiveMissing++;
          if (consecutiveMissing > maxConsecutive) maxConsecutive = consecutiveMissing;
        } else {
          consecutiveMissing = 0;
        }
      }
      const isRisk = missingLetter || maxConsecutive >= 3;
      if (isRisk) {
        riskList.push({
          internship,
          risks: {
            missingCompanyLetter: missingLetter,
            consecutiveLogsMissing: maxConsecutive,
          },
        });
      }
    }
    res.status(200).json({ count: riskList.length, riskList });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const submitLog = async (req, res) => {
  try {
    const internship = await Internship.findOne({ studentId: req.user._id });
    if (!internship) {
      return res.status(404).json({ message: "No internship found. Set up your internship first." });
    }
    const existingLog = await InternshipLog.findOne({
      studentId: req.user._id,
      weekNumber: req.body.weekNumber,
    });
    if (existingLog) {
      return res.status(400).json({ message: `You already submitted a log for week ${req.body.weekNumber}` });
    }
    const { weekNumber, logDate, logDescription, tasksCompleted, category } = req.body;
    const evidenceUrl = req.file
      ? await uploadInternshipFile(req.file, "uni-pocket/internships/logEvidence")
      : "";
    const log = await InternshipLog.create({
      internshipId: internship._id,
      studentId: req.user._id,
      weekNumber,
      logDate,
      logDescription,
      tasksCompleted,
      category,
      evidenceUrl,
    });
    res.status(201).json({ message: "Weekly log submitted successfully", log });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMyLogs = async (req, res) => {
  try {
    const logs = await InternshipLog.find({ studentId: req.user._id }).sort({ weekNumber: 1 });
    const internship = await Internship.findOne({ studentId: req.user._id });
    if (!internship) {
      return res.status(404).json({ message: "No internship found" });
    }
    const today = new Date();
    const start = new Date(internship.startDate);
    const weeksPassed = Math.max(Math.round((today - start) / (1000 * 60 * 60 * 24 * 7)), 0);
    const missingWeeks = [];
    for (let w = 1; w <= weeksPassed; w++) {
      const found = logs.find((l) => l.weekNumber === w);
      if (!found) missingWeeks.push(w);
    }
    const nextDueWeek = missingWeeks.length > 0 ? missingWeeks[0] : weeksPassed + 1;
    const hasReminder = missingWeeks.length > 0;
    res.status(200).json({
      count: logs.length,
      logs,
      reminder: { hasReminder, missingWeeks, nextDueWeek },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteLog = async (req, res) => {
  try {
    const log = await InternshipLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }
    if (log.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this log" });
    }
    if (log.status !== "pending") {
      return res.status(400).json({ message: "Cannot delete a log that has already been reviewed" });
    }
    await InternshipLog.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Log deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getLogById = async (req, res) => {
  try {
    const log = await InternshipLog.findById(req.params.id)
      .populate("studentId", "name email studentId")
      .populate("reviewedBy", "name email");
    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }
    res.status(200).json({ log });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllLogs = async (req, res) => {
  try {
    let logs;
    if (req.user.role === "lecturer") {
      const assignedInternships = await Internship.find({
        assignedLecturer: req.user._id,
      }).select("_id");
      const internshipIds = assignedInternships.map((i) => i._id);
      logs = await InternshipLog.find({ internshipId: { $in: internshipIds } })
        .populate("studentId", "name email studentId department")
        .populate("internshipId", "companyName status")
        .sort({ createdAt: -1 });
    } else {
      logs = await InternshipLog.find()
        .populate("studentId", "name email studentId department")
        .populate("internshipId", "companyName status")
        .sort({ createdAt: -1 });
    }
    res.status(200).json({ count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const reviewLog = async (req, res) => {
  try {
    const log = await InternshipLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }
    const { status, lecturerComment } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }
    log.status = status;
    log.lecturerComment = lecturerComment || "";
    log.reviewedBy = req.user._id;
    log.reviewedAt = new Date();
    await log.save();
    res.status(200).json({ message: `Log ${status} successfully`, log });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProgressStats = async (req, res) => {
  try {
    const internship = await Internship.findOne({ studentId: req.user._id });
    if (!internship) {
      return res.status(404).json({ message: "No internship found" });
    }
    const logs = await InternshipLog.find({ studentId: req.user._id });
    const today = new Date();
    const start = new Date(internship.startDate);
    const end = new Date(internship.endDate);
    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.round(totalDays / 7);
    const weeksDone = Math.max(Math.round((today - start) / (1000 * 60 * 60 * 24 * 7)), 0);
    const weeksLeft = Math.max(totalWeeks - weeksDone, 0);
    const progressPercent = Math.min(Math.round((weeksDone / totalWeeks) * 100), 100);
    const totalLogs = logs.length;
    const approvedLogs = logs.filter((l) => l.status === "approved").length;
    const rejectedLogs = logs.filter((l) => l.status === "rejected").length;
    const pendingLogs = logs.filter((l) => l.status === "pending").length;
    const missingWeeks = [];
    for (let w = 1; w <= weeksDone; w++) {
      const found = logs.find((l) => l.weekNumber === w);
      if (!found) missingWeeks.push(w);
    }
    res.status(200).json({
      progress: { totalWeeks, weeksDone, weeksLeft, progressPercent, totalDays },
      logs: { totalLogs, approvedLogs, rejectedLogs, pendingLogs, missingWeeks },
      milestones: { midTermStatus: internship.midTermStatus, finalStatus: internship.finalStatus },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const getSupervisors = async (req, res) => {
  try {
    const User = require("../models/User");
    // Find the supervisor config document
    const config = await Internship.findOne({ _type: "supervisorConfig" });
    const approvedIds = config ? config.approvedSupervisors : [];
    // Fetch full lecturer details
    const supervisors = await User.find({
      _id: { $in: approvedIds },
      role: "lecturer",
    }).select("_id name email department");
    res.status(200).json({ supervisors });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const assignSupervisor = async (req, res) => {
  try {
    const { lecturerId } = req.params;
    let config = await Internship.findOne({ _type: "supervisorConfig" });
    if (!config) {
      config = await Internship.create({
        _type: "supervisorConfig",
        approvedSupervisors: [],
        // Required fields — use the admin's user ID for the config entry
        studentId: req.user._id,
        companyName: "CONFIG",
        companyAddress: "CONFIG",
        supervisorName: "CONFIG",
        supervisorEmail: "config@system.com",
        startDate: new Date(),
        endDate: new Date(),
      });
    }
    const alreadyAdded = config.approvedSupervisors.includes(lecturerId);
    if (alreadyAdded) {
      return res.status(400).json({ message: "Lecturer already assigned as supervisor" });
    }
    config.approvedSupervisors.push(lecturerId);
    await config.save();
    res.status(200).json({ message: "Supervisor assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const removeSupervisor = async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const config = await Internship.findOne({ _type: "supervisorConfig" });
    if (!config) {
      return res.status(404).json({ message: "No supervisor config found" });
    }
    config.approvedSupervisors = config.approvedSupervisors.filter(
      (id) => id.toString() !== lecturerId
    );
    await config.save();
    res.status(200).json({ message: "Supervisor removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
module.exports = {
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
};