const express = require("express");
const session = require("express-session");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

// helper: parse cookies (simple)
function parseCookies(cookieHeader) {
  const obj = {};
  if (!cookieHeader) return obj;
  cookieHeader.split(';').forEach(pair => {
    const [k,v] = pair.split('=').map(s => s && s.trim());
    if (k) obj[k] = v || '';
  });
  return obj;
}

const app = express();
const PORT = process.env.PORT || 3010;

// Trust the reverse proxy (Render/Railway/etc.) so secure cookies work over HTTPS
app.set("trust proxy", 1);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

//configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "francirene-secret-key-2024",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// File upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Email
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// In-memory database (in production, use MongoDB or SQL database)
let enrollments = [];
let admins = [
  {
    id: "ADMIN001",
    username: "admin",
    password: bcrypt.hashSync("admin123", 10),
    email: process.env.EMAIL_USER,
  },
];
let students = [];
let resources = [];
let timetables = [];
let reviews = [];
let newsletters = [];
let enrollmentClosed = false;
let enrollmentLimit = 50;
let enrollmentCount = 0;
// Welcome motion asset (filename stored here once uploaded by admin)
let welcomeMotion = null;

// Subjects
const SUBJECTS = [
  "Biology",
  "Chemistry",
  "Physics",
  "E-Maths",
  "Core Maths",
  "Social Studies",
  "English",
  "Computer Science",
  "I.C.T",
];

// Service types
const SERVICE_TYPES = [
  "Pre-SHS Special Classes",
  "Vacation Classes",
  "Wassce, Nov/Dec (SHS & Basic)",
  "Nov/Dec & BECE Registration",
  "Adult Education",
  "Preparatory Classes For Pre-Engineering Students",
  "University Admission Form Application (Local And Foreign)",
  "Professional CV Writing & Cover Letter Preparation",
  "Career and Educational Guidance & Counseling",
  "Travelling Passport Application Assistance",
];

//Home page
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Root -> welcome unless cookie set
app.get('/', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies && cookies.skipWelcome === '1') {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  return res.redirect('/welcome');
});

//Admin login page
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

//Admin dashboard
app.get("/admin-dashboard", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin-login");
  }
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});

//Student login
app.get("/student-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student-login.html"));
});

//Parent enrollment
app.get("/parent-enrollment", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "parent-enrollment.html"));
});

// Parent login
app.get("/parent-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "parent-login.html"));
});

//Student dashboard
app.get("/student-dashboard", (req, res) => {
  if (!req.session.student) {
    return res.redirect("/student-login");
  }
  res.sendFile(path.join(__dirname, "public", "student-dashboard.html"));
});

//Parent dashboard
app.get("/parent-dashboard", (req, res) => {
  if (!req.session.parent) {
    return res.redirect("/parent-login");
  }
  res.sendFile(path.join(__dirname, "public", "parent-dashboard.html"));
});
// Route: Welcome splash (also available as static file at /welcome-screen.html)
app.get('/welcome', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'welcome-screen.html'));
});

//Admin login
app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;
  const admin = admins.find((a) => a.username === username);

  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  req.session.admin = admin;
  res.json({ success: true, message: "Login successful", adminId: admin.id });
});

//Save a student review (admin only)
app.post("/api/save-review", (req, res) => {
  if (!req.session.admin)
    return res.status(401).json({ success: false, message: "Unauthorized" });
  const {
    studentId,
    academicPerformance,
    behavior,
    attendance,
    teacherRemarks,
    parentalAdvice,
  } = req.body;
  if (!studentId)
    return res
      .status(400)
      .json({ success: false, message: "Missing studentId" });
  const review = {
    id: uuidv4(),
    studentId,
    academicPerformance,
    behavior,
    attendance,
    teacherRemarks,
    parentalAdvice,
    createdAt: new Date(),
  };
  reviews.push(review);
  res.json({ success: true, message: "Review saved", review });
});

// API: Delete a review
app.delete('/api/reviews/:id', (req, res) => {
  if (!req.session.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id } = req.params;
  const idx = reviews.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Review not found' });
  reviews.splice(idx, 1);
  res.json({ success: true, message: 'Review deleted' });
});

// API: Delete an enrollment (admin only)
app.delete('/api/enrollments/:id', (req, res) => {
  if (!req.session.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id } = req.params;
  const idx = enrollments.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Enrollment not found' });
  const [removed] = enrollments.splice(idx, 1);
  enrollmentCount = Math.max(0, enrollmentCount - 1);
  // remove reviews associated with student
  reviews = reviews.filter(r => r.studentId !== removed.studentId);
  res.json({ success: true, message: 'Enrollment deleted' });
});

//Get reviews for current session or query
app.get("/api/reviews", (req, res) => {
  if (req.session && req.session.admin) {
    const { studentId } = req.query;
    if (studentId)
      return res.json({
        success: true,
        reviews: reviews.filter((r) => r.studentId === studentId),
      });
    return res.json({ success: true, reviews });
  }

  // If student session
  if (req.session && req.session.student) {
    const studentId = req.session.student.studentId;
    return res.json({
      success: true,
      reviews: reviews.filter((r) => r.studentId === studentId),
    });
  }

  // If parent session
  if (req.session && req.session.parent) {
    const studentId = req.session.parent.studentId;
    return res.json({
      success: true,
      reviews: reviews.filter((r) => r.studentId === studentId),
    });
  }

  return res.status(401).json({ success: false, message: "Unauthorized" });
});

//Admin logout
app.post("/api/admin-logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: "Logged out successfully" });
});

// Session info for frontend to display names / session driven UI
app.get('/api/session', (req, res) => {
  if (req.session && req.session.admin) {
    return res.json({ success: true, role: 'admin', admin: { username: req.session.admin.username, id: req.session.admin.id } });
  }

  if (req.session && req.session.parent) {
    return res.json({ success: true, role: 'parent', parent: req.session.parent });
  }

  if (req.session && req.session.student) {
    return res.json({ success: true, role: 'student', student: req.session.student });
  }

  res.json({ success: false, message: 'No active session' });
});

//Parent enrollment
app.post("/api/enroll", async (req, res) => {
  try {
    if (enrollmentClosed || enrollmentCount >= enrollmentLimit) {
      return res.status(400).json({
        success: false,
        message:
          "Enrollment is currently closed Please try again later Seats Are Full.",
      });
    }

    const {
      childName,
      childClass,
      childGender,
      guardianName,
      guardianEmail,
      guardianPhone,
      guardianGender,
      serviceType,
      subjects,
      concerns,
    } = req.body;

    const parentId = "PARENT-" + uuidv4().substring(0, 8).toUpperCase();
    const studentId = "STUDENT-" + uuidv4().substring(0, 8).toUpperCase();
    const studentPassword = Math.random().toString(36).substring(2, 10);
    const parentPassword = Math.random().toString(36).substring(2, 10);

    const enrollment = {
      id: uuidv4(),
      parentId,
      studentId,
      studentPassword,
      parentPassword,
      childName,
      childClass,
      childGender,
      guardianName,
      guardianEmail,
      guardianPhone,
      guardianGender,
      serviceType,
      subjects,
      concerns,
      status: "pending",
      enrollmentDate: new Date(),
    };

    enrollments.push(enrollment);
    enrollmentCount++;

    // Send enrollment confirmation email to parent
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: guardianEmail,
      subject: "Enrollment Confirmation - Francirene Educational Consult",
      html: `
        <h2>Welcome to Francirene Educational Consult</h2>
        <p>Dear ${guardianName},</p>
        <p>Your enrollment has been received and is pending admin approval.</p>
        <h3>Your Credentials:</h3>
        <p><strong>Parent ID:</strong> ${parentId}</p>
        <p><strong>Parent Password:</strong> ${parentPassword}</p>
        <p><strong>Student ID:</strong> ${studentId}</p>
        <p><strong>Temporary Student Password:</strong> ${studentPassword}</p>
        <p>Please keep these credentials safe. You will receive another email once your enrollment is approved.</p>
        <p>Best regards,<br/>Francirene Educational Consult Team</p>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Email error:", err);
      }
    });

    res.json({
      success: true,
      message: "Enrollment submitted successfully. Check your email for IDs.",
      parentId,
      parentPassword,
      studentId,
      studentPassword,
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    res.status(500).json({ success: false, message: "Enrollment failed" });
  }
});

//enrollments for admin
app.get("/api/enrollments", (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  res.json({ success: true, enrollments });
});

//Approve enrollment
app.post("/api/approve-enrollment", async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { enrollmentId } = req.body;
  const enrollment = enrollments.find((e) => e.id === enrollmentId);

  if (!enrollment) {
    return res
      .status(404)
      .json({ success: false, message: "Enrollment not found" });
  }

  enrollment.status = "approved";

  // Send approval email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: enrollment.guardianEmail,
    subject: "Enrollment Approved - Francirene Educational Consult",
    html: `
      <h2>Enrollment Approved!</h2>
      <p>Dear ${enrollment.guardianName},</p>
      <p>Your enrollment has been approved. Your child can now access learning materials.</p>
      <h3>Your Login Credentials:</h3>
      <p><strong>Parent ID:</strong> ${enrollment.parentId}</p>
      <p><strong>Parent Password:</strong> ${enrollment.parentPassword}</p>
      <h3>Student Login Credentials:</h3>
      <p><strong>Student ID:</strong> ${enrollment.studentId}</p>
      <p><strong>Student Password:</strong> ${enrollment.studentPassword}</p>
      <p>Best regards,<br/>Francirene Educational Consult Team</p>
    `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error("Email error:", err);
  });

  res.json({ success: true, message: "Enrollment approved" });
});

//Reject enrollment
app.post("/api/reject-enrollment", async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { enrollmentId } = req.body;
  const enrollment = enrollments.find((e) => e.id === enrollmentId);

  if (!enrollment) {
    return res
      .status(404)
      .json({ success: false, message: "Enrollment not found" });
  }

  enrollment.status = "rejected";

  // Send rejection email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: enrollment.guardianEmail,
    subject: "Enrollment Status - Francirene Educational Consult",
    html: `
      <h2>Enrollment Update</h2>
      <p>Dear ${enrollment.guardianName},</p>
      <p>Unfortunately, your enrollment was not approved at this time.</p>
      <p>Please contact us for more information: ${process.env.EMAIL_USER}</p>
      <p>Best regards,<br/>Francirene Educational Consult Team</p>
    `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error("Email error:", err);
  });

  res.json({ success: true, message: "Enrollment rejected" });
});

//Upload resources
app.post("/api/upload-resource", upload.single("file"), (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { title, subject, description } = req.body;
  const resource = {
    id: uuidv4(),
    title,
    subject,
    description,
    filename: req.file.filename,
    originalName: req.file.originalname,
    uploadDate: new Date(),
  };

  resources.push(resource);
  res.json({ success: true, message: "Resource uploaded", resource });
});

// Upload welcome motion (video) - admin only
app.post('/api/upload-welcome-motion', upload.single('file'), (req, res) => {
  if (!req.session.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

  // If an existing welcome motion exists, remove it from disk
  if (welcomeMotion) {
    const oldPath = path.join(__dirname, 'uploads', welcomeMotion);
    fs.unlink(oldPath, (err) => {
      if (err) console.warn('Failed to remove previous welcome motion:', err.message);
    });
  }

  welcomeMotion = req.file.filename;
  res.json({ success: true, message: 'Welcome motion uploaded', filename: welcomeMotion });
});

// Get current welcome motion info
app.get('/api/welcome-motion', (req, res) => {
  if (!welcomeMotion) return res.json({ success: false, message: 'No welcome motion set' });
  res.json({ success: true, filename: welcomeMotion, url: `/uploads/${welcomeMotion}` });
});

//Get resources for student
app.get("/api/resources/:subject", (req, res) => {
  const { subject } = req.params;
  const subjectResources = resources.filter((r) => r.subject === subject);
  res.json({ success: true, resources: subjectResources });
});

//Get all resources (public) - returns only admin-uploaded resources
app.get("/api/resources", (req, res) => {
  res.json({ success: true, resources });
});
// API: Delete a resource (admin only)
app.delete('/api/resources/:id', (req, res) => {
  if (!req.session.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id } = req.params;
  const idx = resources.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Resource not found' });
  const [removed] = resources.splice(idx, 1);
  // remove file from disk
  const filePath = path.join(__dirname, 'uploads', removed.filename);
  fs.unlink(filePath, (err) => {
    if (err) console.warn('Failed to remove file:', err.message);
  });
  res.json({ success: true, message: 'Resource deleted' });
});

//Student login
app.post("/api/student-login", (req, res) => {
  const { studentId, password } = req.body;
  const enrollment = enrollments.find(
    (e) => e.studentId === studentId && e.studentPassword === password
  );

  if (!enrollment) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid Student ID or password" });
  }

  req.session.student = { studentId, childName: enrollment.childName };
  res.json({ success: true, message: "Student login successful" });
});

//Parent login
app.post("/api/parent-login", (req, res) => {
  const { parentId, password } = req.body;
  const enrollment = enrollments.find(
    (e) => e.parentId === parentId && e.parentPassword === password
  );

  if (!enrollment) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid Parent ID or password" });
  }

  req.session.parent = {
    parentId,
    childName: enrollment.childName,
    studentId: enrollment.studentId,
  };
  res.json({ success: true, message: "Parent login successful" });
});

//Create timetable
app.post("/api/create-timetable", (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { title, startDate, endDate, classes, repeatWeeks } = req.body;
  const timetable = {
    id: uuidv4(),
    title,
    startDate,
    endDate,
    classes,
    repeatWeeks,
    createdDate: new Date(),
  };

  timetables.push(timetable);
  res.json({ success: true, message: "Timetable created", timetable });
});

// Update enrollment limit (admin only)
app.post('/api/update-enrollment-limit', (req, res) => {
  if (!req.session.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { enrollmentLimit: newLimit } = req.body;
  const limit = parseInt(newLimit, 10);
  if (!limit || limit < 1) return res.status(400).json({ success: false, message: 'Invalid enrollment limit' });
  enrollmentLimit = limit;
  res.json({ success: true, message: 'Enrollment limit updated', enrollmentLimit });
});

// Change admin password
app.post('/api/change-password', (req, res) => {
  if (!req.session.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Missing fields' });
  const admin = admins.find(a => a.id === req.session.admin.id || a.username === req.session.admin.username);
  if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
  if (!bcrypt.compareSync(currentPassword, admin.password)) return res.status(400).json({ success: false, message: 'Current password incorrect' });
  admin.password = bcrypt.hashSync(newPassword, 10);
  res.json({ success: true, message: 'Password updated' });
});

// API: Delete timetable
app.delete('/api/timetables/:id', (req, res) => {
  if (!req.session.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id } = req.params;
  const idx = timetables.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Timetable not found' });
  timetables.splice(idx, 1);
  res.json({ success: true, message: 'Timetable deleted' });
});

//Get timetables
app.get("/api/timetables", (req, res) => {
  res.json({ success: true, timetables });
});

//Newsletter signup
app.post("/api/newsletter-signup", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const existingSubscriber = newsletters.find((n) => n.email === email);
    if (existingSubscriber) {
      return res
        .status(400)
        .json({ success: false, message: "Email already subscribed" });
    }

    newsletters.push({ email, name, subscriptionDate: new Date() });

    // Send confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Francirene Educational Consult Newsletter",
      html: `
        <h2>Welcome to Our Newsletter!</h2>
        <p>Dear ${name || "Subscriber"},</p>
        <p>Thank you for subscribing to Francirene Educational Consult newsletter.</p>
        <p>You will now receive updates about our services and educational resources.</p>
        <p>Best regards,<br/>Francirene Educational Consult Team</p>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.error("Email error:", err);
    });

    res.json({
      success: true,
      message: "Successfully subscribed to newsletter",
    });
  } catch (error) {
    console.error("Newsletter signup error:", error);
    res.status(500).json({ success: false, message: "Subscription failed" });
  }
});

//Contact us
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Send email to admin
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Contact Message: ${subject}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.error("Email error:", err);
    });

    // Send confirmation to user
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Message Received - Francirene Educational Consult",
      html: `
        <h2>Thank You for Contacting Us</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>Best regards,<br/>Francirene Educational Consult Team</p>
      `,
    };

    transporter.sendMail(userMailOptions, (err, info) => {
      if (err) console.error("Email error:", err);
    });

    res.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact error:", error);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

//Get enrollment history by email (for user to check their status)
app.get("/api/enrollment-history/:email", (req, res) => {
  try {
    const { email } = req.params;
    const userEnrollments = enrollments.filter(
      (e) => e.guardianEmail.toLowerCase() === email.toLowerCase()
    );

    if (userEnrollments.length === 0) {
      return res.json({
        success: true,
        message: "No enrollments found",
        enrollments: [],
        lastEnrollment: null,
      });
    }

    // Return only non-sensitive information
    const safeEnrollments = userEnrollments.map((e) => ({
      id: e.id,
      parentId: e.parentId,
      studentId: e.studentId,
      childName: e.childName,
      childClass: e.childClass,
      serviceType: e.serviceType,
      subjects: e.subjects,
      status: e.status,
      enrollmentDate: e.enrollmentDate,
    }));

    res.json({
      success: true,
      enrollments: safeEnrollments,
      lastEnrollment: safeEnrollments[safeEnrollments.length - 1],
    });
  } catch (error) {
    console.error("Error fetching enrollment history:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch enrollment history" });
  }
});

//Toggle enrollment status
app.post("/api/toggle-enrollment", (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  enrollmentClosed = !enrollmentClosed;
  res.json({
    success: true,
    enrollmentClosed,
    message: `Enrollment ${enrollmentClosed ? "closed" : "opened"}`,
  });
});

//Get enrollment status
app.get("/api/enrollment-status", (req, res) => {
  res.json({
    success: true,
    enrollmentClosed,
    enrollmentLimit,
    enrollmentCount,
  });
});

//Get subjects
app.get("/api/subjects", (req, res) => {
  res.json({ success: true, subjects: SUBJECTS });
});

//Get service types
app.get("/api/services", (req, res) => {
  res.json({ success: true, services: SERVICE_TYPES });
});

// Health check endpoint (used by hosting platforms + CI)
app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Francirene Educational Consult server running on port ${PORT}`
  );
  console.log("Email: " + process.env.EMAIL_USER);
});
