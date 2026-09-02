require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const complaintsRoutes = require('./routes/complaints');
const clustersRoutes = require('./routes/clusters');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

const cronRoutes = require('./routes/cron');

// Routes
app.use('/api/complaints', complaintsRoutes);
app.use('/api/clusters', clustersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cron', cronRoutes);
// Fallback to index.html for unmatched routes (if using HTML5 history API, though we use distinct HTML files here)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`CitySense AI running on http://localhost:${PORT}`);
  });
}

module.exports = app;
