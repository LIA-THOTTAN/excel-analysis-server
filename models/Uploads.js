// server/models/Upload.js
import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema({
  filename: { type: String, required: true },       // Name stored on server
  originalname: { type: String, required: true },   // Original file name
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },           // File path on server
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to user
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Upload", uploadSchema);
