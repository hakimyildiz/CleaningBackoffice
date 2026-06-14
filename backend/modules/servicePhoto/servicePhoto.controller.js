const ServicePhotoService = require('./servicePhoto.service');
const { sendSuccess, sendError } = require('../../utils/response');

const ServicePhotoController = {
  uploadPhotos: async (req, res, next) => {
    try {
      const { id } = req.params; // ServiceRecordID
      const { photoType } = req.body;
      const photos = await ServicePhotoService.uploadPhotos(id, req.files, photoType, req.user);
      return sendSuccess(res, photos, 201);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  getPhotos: async (req, res, next) => {
    try {
      const { id } = req.params;
      const photos = await ServicePhotoService.getPhotosByRecordId(id);
      return sendSuccess(res, photos, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  },

  deletePhoto: async (req, res, next) => {
    try {
      const { photoId } = req.params;
      const result = await ServicePhotoService.deletePhoto(photoId);
      return sendSuccess(res, result, 200);
    } catch (err) {
      return sendError(res, err.message, err.statusCode || 500);
    }
  }
};

module.exports = ServicePhotoController;
