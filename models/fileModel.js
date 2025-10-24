const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    filePath: {
      type: String,
      required: [true, "File path is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
  },
  { timestamps: true } 
);

module.exports = mongoose.model("File", fileSchema);
