const fs = require('fs');
const path = require('path');
const db = require('../../config/db');
const ServicePhotoModel = require('./servicePhoto.model');
const ServiceRecordModel = require('../serviceRecord/serviceRecord.model');
const driveService = require('../drive/drive.service');
const driveConfig = require('../drive/drive.config');

const ServicePhotoService = {
  uploadPhotos: async (recordId, files, photoType, user) => {
    // 1. Resolve employee
    let employeeId = null;
    const [employeeRows] = await db.query('SELECT EmployeeID FROM Employee WHERE PersonID = ?', [user.personId]);
    if (employeeRows && employeeRows.length > 0) {
      employeeId = employeeRows[0].EmployeeID;
    }

    // 2. Verify ServiceRecord exists
    const record = await ServiceRecordModel.findById(recordId);
    if (!record) {
      const err = new Error(`ServiceRecord with ID ${recordId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (!files || files.length === 0) {
      const err = new Error('No files provided for upload.');
      err.statusCode = 400;
      throw err;
    }

    const uploadedPhotos = [];

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      for (const file of files) {
        // Formulate relative path matching Phase 4 guidelines
        const relativePath = path.posix.join('uploads', 'Mopsy', path.relative(path.join(__dirname, '..', '..', 'uploads', 'Mopsy'), file.path));

        let driveFileId = relativePath;
        let driveURL = relativePath;

        if (driveConfig.isDriveEnabled) {
          try {
            const fileName = path.basename(file.path);
            const driveResult = await driveService.uploadPhoto(file.path, fileName, record);
            driveFileId = driveResult.driveFileId;
            driveURL = driveResult.driveURL;
          } catch (driveErr) {
            console.error(`Google Drive photo upload failed: ${driveErr.message}. Using local path fallback.`);
          }
        }

        const photoId = await ServicePhotoModel.create({
          ServiceRecordID: recordId,
          EmployeeID: employeeId,
          PhotoType: photoType || 'after',
          DriveFileID: driveFileId,
          DriveURL: driveURL
        }, connection);

        uploadedPhotos.push(await ServicePhotoModel.findById(photoId));
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return uploadedPhotos;
  },

  getPhotosByRecordId: async (recordId) => {
    const record = await ServiceRecordModel.findById(recordId);
    if (!record) {
      const err = new Error(`ServiceRecord with ID ${recordId} not found.`);
      err.statusCode = 404;
      throw err;
    }
    return await ServicePhotoModel.findByRecordId(recordId);
  },

  deletePhoto: async (photoId) => {
    const photo = await ServicePhotoModel.findById(photoId);
    if (!photo) {
      const err = new Error(`Service photo with ID ${photoId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    // Resolve absolute path of the file to delete it on disk
    const absolutePath = path.join(__dirname, '..', '..', photo.DriveFileID);

    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (diskErr) {
      // Log error but proceed with DB record deletion so DB remains consistent
      console.error(`Failed to delete physical photo file at ${absolutePath}: ${diskErr.message}`);
    }

    await ServicePhotoModel.delete(photoId);
    return { success: true, message: 'Photo deleted successfully.' };
  }
};

module.exports = ServicePhotoService;
