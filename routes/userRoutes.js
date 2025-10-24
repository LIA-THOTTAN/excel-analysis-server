const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

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
  revokeAdmin,
  previewFile,
  deleteFile,
} = require("../controllers/userController");

const { protect, superadmin, admin } = require("../middleware/auth");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });


router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", protect, getUserProfile);
router.put("/update-profile", protect, updateProfile);
router.post("/upload", protect, upload.single("file"), uploadFile);
router.get("/uploads", protect, getUploadHistory);
router.get("/uploads/preview/:id", protect, previewFile);
router.delete("/uploads/:id", protect, deleteFile);


router.get("/all", protect, admin, getAllUsers);
router.get("/all-admins", protect, admin, getAllAdmins);
router.get("/pending-admins", protect, admin, getPendingAdmins);
router.get("/rejected-admins", protect, admin, getRejectedAdmins);
router.get("/all-uploads", protect, admin, getAllUploadHistory);
router.put("/reject/:id", protect, admin, rejectUser);
router.put("/unreject/:id", protect, admin, unrejectUser);


router.put("/approve/:userId", protect, superadmin, approveAdmin);
router.put("/reject-admin/:userId", protect, superadmin, rejectAdmin);
router.put("/block/:userId", protect, superadmin, blockUser);
router.put("/unblock/:userId", protect, superadmin, unblockUser);
router.put("/revoke-admin/:id", protect, superadmin, revokeAdmin);
router.put("/grant-admin/:userId", protect, superadmin, grantAdmin);
router.put("/grant-user/:userId", protect, superadmin, grantUser);

module.exports = router;
