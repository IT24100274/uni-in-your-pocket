const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const { createTicket, getMyTickets } = require("../controllers/ticketController");


router.get("/test", protect, (req, res) => {
  res.status(200).json({ message: "Ticket routes are live", user: req.user.name });
});


router.post("/", protect, authorize("student", "student_representative"), createTicket);
router.get("/my", protect, authorize("student", "student_representative"), getMyTickets);
// router.get("/all", protect, authorize("admin", "student_representative"), getAllTickets);
// router.get("/forwarded", protect, authorize("lecturer", "admin"), getForwardedTickets);
// router.get("/:id", protect, getTicketById);
// router.put("/:id/respond", protect, authorize("admin", "student_representative", "lecturer"), respondToTicket);
// router.put("/:id/forward", protect, authorize("student_representative"), forwardTicket);
// router.put("/:id/close", protect, closeTicket);
// router.delete("/:id", protect, authorize("admin"), deleteTicket);

module.exports = router;