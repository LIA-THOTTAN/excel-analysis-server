
import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema({
  filename: { type: String, required: true },       
  originalname: { type: String, required: true },   
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },          
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Upload", uploadSchema);
