const express = require('express');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');

const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const app = express();

// ✅ Add your actual deployed frontend URLs here
const allowedOrigins = [
  "https://excel-analysis-client.vercel.app",
  "https://excel-analysis-client-syls-8bpqqx.vm-lia-thottan-s-projects.vercel.app", // ✅ your current Vercel project
  "http://localhost:5173", // for local dev
];

// ✅ CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., Postman or server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Static file route for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Main API routes
app.use('/api/users', require('./routes/userRoutes'));

// ✅ Global error handler
app.use(errorHandler);

// ✅ Server startup
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
