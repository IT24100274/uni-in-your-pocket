const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Uni in Your Pocket API is running" });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/enrollments", require("./routes/enrollmentRoutes"));
app.use("/api/assignments", require("./routes/assignmentRoutes"));
app.use("/api/notices", require("./routes/noticeRoutes"));
//Mohamed's Intrnnship Routes
app.use("/api/internship", require("./routes/internshipRoutes"));
//Mahdhi's ticket routes
app.use("/api/tickets", require("./routes/ticketRoutes"));

// Sathya's marks & results routes
app.use("/api/results", require("./routes/resultRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
