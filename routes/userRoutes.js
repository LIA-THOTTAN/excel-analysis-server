const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { protect, superadmin, admin } = require("../middleware/auth");

const {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  getAllAdmins,
  getPendingAdmins,
  getRejectedAdmins,
  approveAdmin,
  rejectAdmin,
  blockUser,
  unblockUser,
  grantUser,
  grantAdmin,
  uploadFile,
  getUploadHistory,
  getAllUploadHistory,
  updateProfile,
  rejectUser,
  unrejectUser,
  previewFile,   // ✅ added from controller
  deleteFile,    // ✅ added from controller
} = require("../controllers/userController");

/* ------------------- MULTER STORAGE ------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // save inside /uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/* ------------------- PUBLIC ROUTES ------------------- */
router.post("/register", registerUser);
router.post("/login", loginUser);

/* ------------------- USER PROFILE ROUTES ------------------- */
router.get("/profile", protect, getUserProfile);
router.put("/update-profile", protect, updateProfile);

/* ------------------- ADMIN ROUTES ------------------- */
router.get("/all", protect, admin, getAllUsers);
router.get("/all-admins", protect, admin, getAllAdmins);
router.get("/pending-admins", protect, admin, getPendingAdmins);
router.get("/rejected-admins", protect, admin, getRejectedAdmins);
router.put("/reject/:id", protect, admin, rejectUser);
router.put("/unreject/:id", protect, admin, unrejectUser);

/* ------------------- SUPERADMIN ROUTES ------------------- */
router.put("/approve/:userId", protect, superadmin, approveAdmin);
router.put("/reject-admin/:userId", protect, superadmin, rejectAdmin);
router.put("/block/:userId", protect, superadmin, blockUser);
router.put("/unblock/:userId", protect, superadmin, unblockUser);
router.put("/grant-admin/:userId", protect, superadmin, grantAdmin);
router.put("/grant-user/:userId", protect, superadmin, grantUser);

/* ------------------- FILE ROUTES ------------------- */
router.post("/upload", protect, upload.single("file"), uploadFile);
router.get("/uploads", protect, getUploadHistory);
router.get("/all-uploads", protect, admin, getAllUploadHistory);
router.get("/uploads/preview/:id", protect, previewFile);   // ✅ Preview route
router.delete("/uploads/:id", protect, deleteFile);         // ✅ Delete route

module.exports = router;
