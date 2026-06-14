const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Helper to format date and time to DD-MM-YY and HHMMSS
const getFormattedDateTime = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = String(now.getFullYear()).substring(2, 4);
  
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  
  return {
    dateStr: `${day}-${month}-${year}`,
    timeStr: `${hours}${minutes}${seconds}`
  };
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const serviceRecordId = req.params.id;
      if (!serviceRecordId) {
        return cb(new Error('ServiceRecord ID is required for photo upload.'));
      }

      // Query database to fetch CustomerID, AgencyID, and ServiceID for path resolution
      const [rows] = await db.query(
        'SELECT CustomerID, AgencyID, ServiceID FROM ServiceRecord WHERE ServiceRecordID = ?',
        [serviceRecordId]
      );

      if (!rows || rows.length === 0) {
        return cb(new Error(`ServiceRecord with ID ${serviceRecordId} not found.`));
      }

      const record = rows[0];
      const ownerFolder = record.CustomerID 
        ? String(record.CustomerID) 
        : `agency_${record.AgencyID || 0}`;

      // Target path: backend/uploads/Mopsy/[CustomerID or agency_AgencyID]/[ServiceID]/
      // Note: Make path relative to backend root
      const uploadDir = path.join(__dirname, '..', 'uploads', 'Mopsy', ownerFolder, String(record.ServiceID));

      // Ensure directory exists recursively
      fs.mkdirSync(uploadDir, { recursive: true });
      
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const serviceRecordId = req.params.id;
    const { dateStr, timeStr } = getFormattedDateTime();
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Format: [ServiceRecordID]_[DD-MM-YY]_[HHMMSS][ext]
    // Zero-padded ID to 5 digits for neat sorting
    const paddedId = String(serviceRecordId).padStart(5, '0');
    const filename = `${paddedId}_${dateStr}_${timeStr}${ext}`;
    
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
  }
};

const limits = {
  // Max size read from env or defaults to 10MB
  fileSize: (parseInt(process.env.MAX_PHOTO_SIZE_MB) || 10) * 1024 * 1024,
  files: 10
};

const upload = multer({
  storage,
  fileFilter,
  limits
}).array('photos', 10);

// Wrapper middleware to intercept Multer errors and format as standard API error response
const uploadPhotos = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      let message = err.message;
      if (err.code === 'LIMIT_FILE_SIZE') {
        const sizeMb = process.env.MAX_PHOTO_SIZE_MB || 10;
        message = `File size exceeds the limit of ${sizeMb}MB.`;
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        message = 'Cannot upload more than 10 files per request.';
      }
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    next();
  });
};

module.exports = {
  uploadPhotos
};
