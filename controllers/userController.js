// controllers/userController.js
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");

const User = require("../models/userModel");
const File = require("../models/fileModel");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, requestAdmin } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email, and password");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const userRole = "user";
  const adminRequestStatus = requestAdmin ? "pending" : null;

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
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
      message: "Registration successful",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

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
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json(user);
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json(users);
});

const getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: "admin" }).select("-password");
  res.json(admins);
});

const getPendingAdmins = asyncHandler(async (req, res) => {
  const pendingAdmins = await User.find({ adminRequestStatus: "pending" }).select("-password");
  res.json(pendingAdmins);
});

const getRejectedAdmins = asyncHandler(async (req, res) => {
  const rejectedAdmins = await User.find({ adminRequestStatus: "rejected" }).select("-password");
  res.json(rejectedAdmins);
});

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

  user.isBlocked = false;
  await user.save();
  res.json({ message: "User unblocked successfully", user });
});

const grantUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
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

  res.json({ message: "Profile updated successfully", user: user });
});

// NEW: rejectUser & unrejectUser - ensure these exist and are exported
const rejectUser = asyncHandler(async (req, res) => {
  const { id } = req.params; // note: your route uses /reject/:id
  const user = await User.findById(id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Only normal users should be rejected (as in your earlier version)
  if (user.role !== "user") {
    res.status(403);
    throw new Error("Only normal users can be rejected");
  }

  user.adminRequestStatus = "rejected";
  await user.save();
  res.json({ message: "User rejected successfully", user });
});

const unrejectUser = asyncHandler(async (req, res) => {
  const { id } = req.params; // route uses /unreject/:id
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

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const uploadedBy = req.user.id;
  const newFile = await File.create({
    fileName: req.file.originalname,
    filePath: req.file.path,
    fileSize: req.file.size,
    uploadedBy,
  });

  res.status(201).json({ message: "File uploaded successfully", file: newFile });
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

const previewFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id).populate("uploadedBy", "name email role");
  if (!file) {
    res.status(404);
    throw new Error("File not found");
  }

  const me = req.user;
  const isUploader = file.uploadedBy && file.uploadedBy._id.toString() === me.id;
  const isAdmin = me.role === "admin" || me.role === "superadmin";
  if (!isUploader && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to preview this file");
  }

  const absolutePath = path.isAbsolute(file.filePath)
    ? file.filePath
    : path.join(process.cwd(), file.filePath);
  if (!fs.existsSync(absolutePath)) {
    res.status(404);
    throw new Error("File not found on server");
  }

  const workbook = xlsx.readFile(absolutePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

  res.json({ fileName: file.fileName, data });
});

const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id).populate("uploadedBy", "name email role");
  if (!file) {
    res.status(404);
    throw new Error("File not found");
  }

  const me = req.user;
  const isUploader = file.uploadedBy && file.uploadedBy._id.toString() === me.id;
  const isAdmin = me.role === "admin" || me.role === "superadmin";
  if (!isUploader && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to delete this file");
  }

  const absolutePath = path.isAbsolute(file.filePath)
    ? file.filePath
    : path.join(process.cwd(), file.filePath);
  if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);

  await file.deleteOne();
  res.json({ message: "File deleted successfully" });
});

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
