const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const ComplaintCluster = require('../models/ComplaintCluster');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { analyzeComplaint, generateRootCause, transcribeAudio } = require('../services/ai');
const os = require('os');
const fs = require('fs');
const { calculateCombinedSimilarity } = require('../services/clustering');
const { calculatePriority } = require('../services/priority-engine');

const JWT_SECRET = process.env.JWT_SECRET || 'citysense_secret_key_123!';
const authMiddleware = require('../middleware/auth');

// Setup Multer to use memory storage for Vercel serverless compatibility
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

const audioUpload = multer({ 
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => {
      cb(null, 'audio-' + Date.now() + '.webm');
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

// GET /api/complaints
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'citizen') {
      query.user = req.user.id;
    } else if (req.user.role === 'admin_ward') {
      query.ward = req.user.ward;
    } else if (req.user.role === 'admin_city') {
      query.municipalCorp = req.user.municipalCorp;
    } else if (req.user.role === 'admin_state') {
      query.state = req.user.state;
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate('clusters');
    res.json(complaints);
  } catch (error) {
    next(error);
  }
});

// GET /api/complaints/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('clusters');
      
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    
    // Convert ObjectIds to strings for comparison
    if (req.user.role !== 'admin' && complaint.user?.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden. Not your report." });
    }
    
    res.json(complaint);
  } catch (error) {
    next(error);
  }
});

// POST /api/complaints
router.post('/', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    const { description, duration, latitude, longitude, address, affectedPeople } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    const durationDays = parseInt(duration, 10) || 1;
    const lat = parseFloat(latitude) || 0;
    const lng = parseFloat(longitude) || 0;
    let imageUrl = null;
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      imageUrl = `data:${mimeType};base64,${base64Image}`;
    }

    const { processNewComplaint } = require('../services/complaint-processor');
    const { complaint, analysis, clusterId } = await processNewComplaint(req.body, req.user.id, imageUrl);

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint,
      analysis,
      clusterId
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/complaints/transcribe
router.post('/transcribe', authMiddleware, audioUpload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }
    
    const text = await transcribeAudio(req.file.path);
    
    // Cleanup temp file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete temp audio file:", err);
    });
    
    res.json({ text });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
});

module.exports = router;
