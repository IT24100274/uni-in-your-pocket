const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Connect to our Cloudinary account using keys from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer saves the file in memory temporarily (not on disk)
// We will then manually upload it to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// This function takes the file from memory and uploads it to Cloudinary
// We call this manually inside our controller
const uploadToCloudinary = (fileBuffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
        access_mode: "public",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

module.exports = { cloudinary, upload, uploadToCloudinary };