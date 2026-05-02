const Notice = require("../models/Notice");
const { uploadToCloudinary } = require("../config/cloudinary");

// ─── CREATE NOTICE / EVENT ────────────────────────────────────────────────────
// POST /api/notices
// Access: admin, lecturer, student_representative
const createNotice = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      targetRoles,
      targetDepartments,
      eventDate,
      eventLocation,
    } = req.body;

    // Handle file uploads — use "raw" resource type for PDFs, default for images
    let attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const isPdf = file.mimetype === "application/pdf";
        const result = await uploadToCloudinary(
          file.buffer,
          "uni-pocket/notices",
          isPdf ? "raw" : "image"
        );
        attachments.push({
          url:          result.secure_url,
          originalName: file.originalname,
          fileType:     isPdf ? "pdf" : "image",
        });
      }
    }

    // targetRoles and targetDepartments arrive as JSON strings when using FormData
    const notice = await Notice.create({
      title,
      content,
      type:              type || "notice",
      targetRoles:       targetRoles       ? JSON.parse(targetRoles)       : [],
      targetDepartments: targetDepartments ? JSON.parse(targetDepartments) : [],
      eventDate:         eventDate  || null,
      eventLocation:     eventLocation || null,
      attachments,
      createdBy:         req.user._id,
    });

    const populated = await notice.populate("createdBy", "name role department");
    res.status(201).json(populated);
  } catch (error) {
    console.error("createNotice error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET ALL NOTICES (filtered for the logged-in user) ───────────────────────
// GET /api/notices
// Access: all authenticated users
// Returns only notices/events relevant to the user's role and department
const getNotices = async (req, res) => {
  try {
    const { role, department } = req.user;

    // A notice is visible if:
    //   - targetRoles is empty (broadcast to all) OR user's role is in targetRoles
    //   - AND targetDepartments is empty (all depts) OR user's department is in targetDepartments
    const query = {
      isActive: true,
      $and: [
        {
          $or: [
            { targetRoles: { $size: 0 } },
            { targetRoles: role },
          ],
        },
        {
          $or: [
            { targetDepartments: { $size: 0 } },
            { targetDepartments: department || "" },
          ],
        },
      ],
    };

    // Admins see everything
    const finalQuery = role === "admin" ? { isActive: true } : query;

    const notices = await Notice.find(finalQuery)
      .populate("createdBy", "name role department")
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (error) {
    console.error("getNotices error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET ALL NOTICES (admin — unfiltered) ─────────────────────────────────────
// GET /api/notices/all
// Access: admin only
const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate("createdBy", "name role department")
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (error) {
    console.error("getAllNotices error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET SINGLE NOTICE ───────────────────────────────────────────────────────
// GET /api/notices/:id
// Access: all authenticated users
const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).populate(
      "createdBy",
      "name role department"
    );

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.json(notice);
  } catch (error) {
    console.error("getNoticeById error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── UPDATE NOTICE ───────────────────────────────────────────────────────────
// PUT /api/notices/:id
// Access: admin, or the creator (lecturer / student_rep)
const updateNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    // Only admin or the original creator can update
    if (
      req.user.role !== "admin" &&
      notice.createdBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this notice" });
    }

    const {
      title,
      content,
      type,
      targetRoles,
      targetDepartments,
      eventDate,
      eventLocation,
      isActive,
    } = req.body;

    // Handle new file uploads on edit
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const isPdf = file.mimetype === "application/pdf";
        const result = await uploadToCloudinary(
          file.buffer,
          "uni-pocket/notices",
          isPdf ? "raw" : "image"
        );
        notice.attachments.push({
          url:          result.secure_url,
          originalName: file.originalname,
          fileType:     isPdf ? "pdf" : "image",
        });
      }
    }

    notice.title             = title             ?? notice.title;
    notice.content           = content           ?? notice.content;
    notice.type              = type              ?? notice.type;
    notice.targetRoles       = targetRoles       ? JSON.parse(targetRoles)       : notice.targetRoles;
    notice.targetDepartments = targetDepartments ? JSON.parse(targetDepartments) : notice.targetDepartments;
    notice.eventDate         = eventDate         ?? notice.eventDate;
    notice.eventLocation     = eventLocation     ?? notice.eventLocation;
    if (isActive !== undefined) notice.isActive  = isActive;

    await notice.save();
    const updated = await notice.populate("createdBy", "name role department");
    res.json(updated);
  } catch (error) {
    console.error("updateNotice error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── DELETE NOTICE ───────────────────────────────────────────────────────────
// DELETE /api/notices/:id
// Access: admin, or the creator
const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    if (
      req.user.role !== "admin" &&
      notice.createdBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this notice" });
    }

    await notice.deleteOne();
    res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("deleteNotice error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createNotice,
  getNotices,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
};