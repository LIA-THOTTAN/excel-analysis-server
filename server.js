const express = require("express");
const dotenv = require("dotenv").config();
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const { errorHandler } = require("./middleware/errorMiddleware");

const port = process.env.PORT || 5000;


connectDB();

const app = express();


app.use(
  cors({
    origin: [
      "https://excel-analysis-client.vercel.app", 
      "http://localhost:5173", 
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use("/api/users", require("./routes/userRoutes"));


app.get("/", (req, res) => {
  res.send("Excel Analysis Backend running successfully!");
});


app.use(errorHandler);


app.listen(port, () => console.log(`Server running on port ${port}`));
