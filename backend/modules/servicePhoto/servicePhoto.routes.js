const express = require('express');
const router = express.Router();
const ServicePhotoController = require('./servicePhoto.controller');
const verifyToken = require('../../middleware/auth');
const requireRole = require('../../middleware/role');
const { uploadPhotos } = require('../../middleware/upload');

// Photos upload and listing under ServiceRecord
router.post('/service-records/:id/photos', verifyToken, uploadPhotos, ServicePhotoController.uploadPhotos);
router.get('/service-records/:id/photos', verifyToken, requireRole('admin', 'manager', 'cleaner_manager'), ServicePhotoController.getPhotos);

// Deleting standalone photo (admin, manager)
router.delete('/photos/:photoId', verifyToken, requireRole('admin', 'manager'), ServicePhotoController.deletePhoto);

module.exports = router;
