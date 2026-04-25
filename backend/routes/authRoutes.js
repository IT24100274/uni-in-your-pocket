const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getPendingUsers,
  approveUser,
  declineUser,
  createUser,
  upgradeToRepresentative,
  getAllUsers,
  changePassword,
  deleteOwnAccount,
  deleteUserByAdmin,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Private routes (any logged-in user)
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteOwnAccount);

// Admin-only routes
router.get("/admin/pending", protect, authorize("admin"), getPendingUsers);
router.put("/admin/approve/:id", protect, authorize("admin"), approveUser);
router.put("/admin/decline/:id", protect, authorize("admin"), declineUser);
router.post("/admin/create-user", protect, authorize("admin"), createUser);
router.put("/admin/upgrade/:id", protect, authorize("admin"), upgradeToRepresentative);
router.get("/admin/users", protect, authorize("admin"), getAllUsers);
router.delete("/admin/delete-user/:id", protect, authorize("admin"), deleteUserByAdmin);

module.exports = router;