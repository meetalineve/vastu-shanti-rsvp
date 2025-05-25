const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('public'));

// MongoDB connection with better error handling for serverless
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vastu-shanti-rsvp';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// RSVP Schema
const rsvpSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s\-\(\)]{10,15}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  attendance: {
    type: String,
    required: true,
    enum: ['yes', 'no']
  },
  guestCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
    validate: {
      validator: function(v) {
        if (this.attendance === 'yes') {
          return v > 0;
        }
        return true;
      },
      message: 'Guest count is required when attending'
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Create indexes
rsvpSchema.index({ phone: 1 });
rsvpSchema.index({ submittedAt: -1 });

const RSVP = mongoose.models.RSVP || mongoose.model('RSVP', rsvpSchema);

// Middleware to ensure DB connection
const ensureDBConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(503).json({ 
      error: 'Database connection failed. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Health check endpoint
app.get('/health', ensureDBConnection, async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Test database connection
app.get('/api/test-db', ensureDBConnection, async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    const count = await RSVP.countDocuments();
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      totalRSVPs: count
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Submit RSVP
app.post('/api/rsvp', ensureDBConnection, async (req, res) => {
  try {
    console.log('Received RSVP data:', req.body);

    const { name, phone, attendance, guestCount } = req.body;

    // Validation
    if (!name || !phone || !attendance) {
      return res.status(400).json({
        error: 'Name, phone, and attendance are required',
        validationErrors: true
      });
    }

    if (attendance === 'yes' && (!guestCount || guestCount < 1)) {
      return res.status(400).json({
        error: 'Please specify number of guests when attending',
        validationErrors: true
      });
    }

    // Clean phone number
    const cleanPhone = phone.trim().replace(/\s+/g, '');

    // Check for duplicate phone number
    const existingRSVP = await RSVP.findOne({ phone: cleanPhone });
    if (existingRSVP) {
      return res.status(409).json({
        error: 'RSVP already submitted for this phone number. If you need to make changes, please contact the host.',
        duplicate: true,
        existingRSVP: {
          name: existingRSVP.name,
          attendance: existingRSVP.attendance,
          guestCount: existingRSVP.guestCount,
          submittedAt: existingRSVP.submittedAt
        }
      });
    }

    // Create new RSVP
    const rsvpData = {
      name: name.trim(),
      phone: cleanPhone,
      attendance: attendance,
      guestCount: attendance === 'yes' ? parseInt(guestCount) : 0,
      ipAddress: req.ip || req.connection.remoteAddress
    };

    const newRSVP = new RSVP(rsvpData);
    const savedRSVP = await newRSVP.save();

    console.log('RSVP saved successfully:', savedRSVP._id);

    // Send success response
    res.status(201).json({
      success: true,
      message: 'RSVP submitted successfully',
      rsvp: {
        id: savedRSVP._id,
        name: savedRSVP.name,
        attendance: savedRSVP.attendance,
        guestCount: savedRSVP.guestCount,
        submittedAt: savedRSVP.submittedAt
      }
    });

  } catch (error) {
    console.error('RSVP submission error:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors.join(', '),
        validationErrors: true
      });
    }

    if (error.code === 11000) { // Duplicate key error
      return res.status(409).json({
        error: 'RSVP already submitted for this phone number',
        duplicate: true
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Internal server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all RSVPs (for admin)
app.get('/api/rsvps', ensureDBConnection, async (req, res) => {
  try {
    const rsvps = await RSVP.find({})
      .select('-ipAddress') // Don't send IP addresses
      .sort({ submittedAt: -1 });

    const stats = {
      total: rsvps.length,
      attending: rsvps.filter(r => r.attendance === 'yes').length,
      notAttending: rsvps.filter(r => r.attendance === 'no').length,
      totalGuests: rsvps.reduce((sum, r) => sum + (r.guestCount || 0), 0)
    };

    res.json({
      success: true,
      rsvps: rsvps,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    res.status(500).json({
      error: 'Failed to fetch RSVPs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get RSVP statistics
app.get('/api/stats', ensureDBConnection, async (req, res) => {
  try {
    const total = await RSVP.countDocuments();
    const attending = await RSVP.countDocuments({ attendance: 'yes' });
    const notAttending = await RSVP.countDocuments({ attendance: 'no' });
    
    const guestCountResult = await RSVP.aggregate([
      { $group: { _id: null, totalGuests: { $sum: '$guestCount' } } }
    ]);
    
    const totalGuests = guestCountResult.length > 0 ? guestCountResult[0].totalGuests : 0;

    res.json({
      success: true,
      stats: {
        total,
        attending,
        notAttending,
        totalGuests
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics'
    });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Page not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// For Vercel serverless functions
if (process.env.NODE_ENV !== 'production') {
  const port = PORT;
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📱 RSVP form: http://localhost:${port}`);
    console.log(`👨‍💼 Admin panel: http://localhost:${port}/admin`);
  });
}

// Export for Vercel
module.exports = app;