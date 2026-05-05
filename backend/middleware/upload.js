const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/*
 * Upload Middleware — Multer + Cloudinary
 * Handles all file uploads in the Internship Tracker module.
 * PDFs are stored as "raw" resource type so they open correctly on mobile.
 * Images including HEIC are stored as "image" type.
 * File size is limited to 5MB.
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === "application/pdf";
    return {
      folder: "uni-in-your-pocket/internship",
      resource_type: isPDF ? "raw" : "image",
      allowed_formats: ["jpg", "jpeg", "png", "pdf", "heic", "heif"],
    };
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;