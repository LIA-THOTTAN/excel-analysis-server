const express = require('express');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');

const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: [
      "https://excel-analysis-client.vercel.app",
      "https://excel-analysis-client-syls-8o09ubmyj-lia-thottan-s-projects.vercel.app",
    ],
    credentials: true,
  })
);


// This line is crucial for serving the uploaded files.
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

// This line connects the API endpoints to your server.
app.use('/api/users', require('./routes/userRoutes'));

app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`));