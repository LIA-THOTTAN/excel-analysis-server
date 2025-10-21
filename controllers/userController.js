// controllers/userController.js
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");

const User = require("../models/userModel");
const File = require("../models/fileModel");
const bcrypt = require("bcryptjs");

/* ------------------- TOKEN GENERATOR ------------------- */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/* ------------------- USER REGISTRATION ------------------- */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, requestAdmin } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const userRole = "user";
  const adminRequestStatus = requestAdmin ? "pending" : null;

  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
    adminRequestStatus,
    lastLogin: new Date(),
    isBlocked: false,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

/* ------------------- LOGIN ------------------- */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (user.adminRequestStatus === "pending") {
      res.status(403);
      throw new Error("Your admin request is pending. Please wait for approval.");
    }

    if (user.isBlocked) {
      res.status(403);
      throw new Error("Your account is blocked. Contact support.");
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

/* ------------------- PROFILE ------------------- */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      adminRequestStatus: user.adminRequestStatus,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isBlocked: user.isBlocked,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

/* ------------------- FETCH USERS / ADMINS ------------------- */
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["user", "admin", "superadmin"] },
    }).select("-password");

    if (!Array.isArray(users)) {
      return res.status(500).json({ message: "Users data is not an array" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});


const getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: "admin" }).select("-password");
  res.json(admins);
});

const getPendingAdmins = asyncHandler(async (req, res) => {
  const pendingAdmins = await User.find({ adminRequestStatus: "pending" }).select(
    "-password"
  );
  res.json(pendingAdmins);
});

const getRejectedAdmins = asyncHandler(async (req, res) => {
  const rejectedAdmins = await User.find({ adminRequestStatus: "rejected" }).select(
    "-password"
  );
  res.json(rejectedAdmins);
});

/* ------------------- ADMIN MANAGEMENT ------------------- */
const approveAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.role = "admin";
  user.adminRequestStatus = "accepted";
  await user.save();
  res.json({ message: "Admin approved successfully", user });
});

const rejectAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.role = "user";
  user.adminRequestStatus = "rejected";
  await user.save();
  res.json({ message: "Admin request rejected successfully", user });
});

/* ------------------- SUPERADMIN: BLOCK / UNBLOCK USERS ------------------- */
const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role === "superadmin") {
    res.status(403);
    throw new Error("Cannot block a Super Admin");
  }

  user.adminRequestStatus = "rejected";
  user.isBlocked = true;
  await user.save();

  res.json({ message: "User blocked successfully", user });
});

const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.adminRequestStatus = null;
  user.isBlocked = false;
  user.role = "user";
  await user.save();

  res.json({ message: "User unblocked successfully", user });
});

/* ------------------- ADMIN: REJECT / UNREJECT NORMAL USERS ------------------- */
const rejectUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role !== "user") {
    res.status(403);
    throw new Error("Only normal users can be rejected");
  }

  user.adminRequestStatus = "rejected";
  await user.save();
  res.json({ message: "User rejected successfully", user });
});

const unrejectUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role !== "user") {
    res.status(403);
    throw new Error("Only normal users can be unrejected");
  }

  user.adminRequestStatus = null;
  await user.save();
  res.json({ message: "User moved back to normal users", user });
});

/* ------------------- ROLE GRANTS ------------------- */
const grantUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role === "superadmin") {
    res.status(403);
    throw new Error("Cannot change the role of a Super Admin");
  }

  user.role = "user";
  user.adminRequestStatus = null;
  await user.save();
  res.json({ message: "User role granted successfully", user });
});

const grantAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.role = "admin";
  user.adminRequestStatus = "accepted";
  await user.save();
  res.json({ message: "Admin role granted successfully", user });
});

/* ------------------- PROFILE UPDATES ------------------- */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
  }
  await user.save();

  const updatedUser = await User.findById(req.user.id).select("-password");
  res.status(200).json({
    message: "Profile updated successfully!",
    user: updatedUser,
  });
});

/* ------------------- FILE UPLOADS ------------------- */
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const uploadedBy = req.user.id;

  // Save record in MongoDB
  const newFile = await File.create({
    fileName: req.file.originalname,
    filePath: req.file.path, // multer sets this (e.g., "uploads/16789123.xlsx")
    fileSize: req.file.size,
    uploadedBy,
  });

  res.status(201).json({
    message: "File uploaded successfully",
    file: newFile,
  });
});

const getUploadHistory = asyncHandler(async (req, res) => {
  const files = await File.find({ uploadedBy: req.user.id })
    .populate("uploadedBy", "name email role")
    .sort({ createdAt: -1 });

  res.json(files);
});

const getAllUploadHistory = asyncHandler(async (req, res) => {
  const files = await File.find()
    .populate("uploadedBy", "name email role")
    .sort({ createdAt: -1 });

  res.json(files);
});

/* ------------------- NEW: PREVIEW FILE ------------------- */
/* 
   Permission: uploader OR admin OR superadmin
   Returns: JSON array converted from first sheet
*/
const previewFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id).populate("uploadedBy", "name email role");
  if (!file) {
    res.status(404);
    throw new Error("File not found");
  }

  // permission check: uploader or admin/superadmin
  const me = req.user;
  const isUploader = file.uploadedBy && file.uploadedBy._id.toString() === me.id;
  const isAdmin = me.role === "admin" || me.role === "superadmin";
  if (!isUploader && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to preview this file");
  }

  // Resolve absolute path to file
  const absolutePath = path.isAbsolute(file.filePath)
    ? file.filePath
    : path.join(process.cwd(), file.filePath);

  if (!fs.existsSync(absolutePath)) {
    res.status(404);
    throw new Error("File not found on server filesystem");
  }

  // Read workbook & convert first sheet to JSON
  const workbook = xlsx.readFile(absolutePath, { raw: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

  res.json({ fileName: file.fileName, data });
});

/* ------------------- NEW: DELETE FILE ------------------- */
/*
   Permission: uploader OR admin OR superadmin
   Removes DB record and physical file (if exists)
*/
const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id).populate("uploadedBy", "name email role");
  if (!file) {
    res.status(404);
    throw new Error("File not found");
  }

  // permission check: uploader or admin/superadmin
  const me = req.user;
  const isUploader = file.uploadedBy && file.uploadedBy._id.toString() === me.id;
  const isAdmin = me.role === "admin" || me.role === "superadmin";
  if (!isUploader && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to delete this file");
  }

  // delete physical file if exists
  const absolutePath = path.isAbsolute(file.filePath)
    ? file.filePath
    : path.join(process.cwd(), file.filePath);

  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    // don't block delete if unlink fails for some reason; still attempt DB delete
    console.warn("Failed to unlink file:", err.message || err);
  }

  // delete DB record
  await file.deleteOne();

  res.json({ message: "File deleted successfully" });
});

/* ------------------- EXPORTS ------------------- */
module.exports = {
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
  updateProfile,
  uploadFile,
  getUploadHistory,
  getAllUploadHistory,
  rejectUser,
  unrejectUser,
  previewFile,
  deleteFile,
};
