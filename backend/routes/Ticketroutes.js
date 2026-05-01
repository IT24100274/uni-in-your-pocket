const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  getForwardedTickets,
  getTicketById,
  respondToTicket,
  forwardTicket,
  closeTicket,
  deleteTicket,
} = require("../controllers/ticketController");

// upload.single("attachment") handles the optional file — field name must be "attachment"
router.post("/", protect, authorize("student", "student_representative"), upload.single("attachment"), createTicket);
router.get("/my", protect, authorize("student", "student_representative"), getMyTickets);
router.get("/all", protect, authorize("admin", "student_representative"), getAllTickets);
router.get("/forwarded", protect, authorize("lecturer", "admin"), getForwardedTickets);
router.get("/:id", protect, getTicketById);
router.put("/:id/respond", protect, authorize("admin", "student_representative", "lecturer"), respondToTicket);
router.put("/:id/forward", protect, authorize("student_representative"), forwardTicket);
router.put("/:id/close", protect, closeTicket);
router.delete("/:id", protect, authorize("admin"), deleteTicket);

module.exports = router;