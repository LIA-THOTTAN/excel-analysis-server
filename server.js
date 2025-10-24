const express = require('express');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');

const port = process.env.PORT || 5000;

connectDB();

const app = express();


const allowedOrigins = [
  "https://excel-analysis-client.vercel.app",
  "https://excel-analysis-client-syls-8o09ubmyj-lia-thottan-s-projects.vercel.app",
  "http://localhost:5173", 
];

app.use(
  cors({
    origin: function (origin, callback) {
      
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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users', require('./routes/userRoutes'));


app.use(errorHandler);

app.listen(port, () => console.log(`✅ Server running on port ${port}`));
