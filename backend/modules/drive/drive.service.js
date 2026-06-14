const { google } = require('googleapis');
const fs = require('fs');
const driveConfig = require('./drive.config');
const logger = require('../../utils/logger');

let drive = null;

if (driveConfig.isDriveEnabled) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: driveConfig.keyPath,
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    drive = google.drive({ version: 'v3', auth });
  } catch (error) {
    logger.error(`Failed to initialize Google Drive client: ${error.message}`);
  }
}

/**
 * Searches for a folder with the specified name under the parent folder.
 * If found, returns its ID. If not found, creates the folder and returns its ID.
 */
async function getOrCreateFolder(name, parentId) {
  if (!drive) {
    throw new Error('Google Drive client is not initialized.');
  }

  // Escape single quotes in the folder name for query safety
  const safeName = name.replace(/'/g, "\\'");
  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeName}' and '${parentId}' in parents and trashed = false`;

  const response = await drive.files.list({
    q,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 1
  });

  const files = response.data.files;
  if (files && files.length > 0) {
    return files[0].id;
  }

  // Folder doesn't exist, create it
  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId]
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id'
  });

  return folder.data.id;
}

/**
 * Uploads a file stream to Google Drive inside the structured path: [Year]/[CustomerID]/[ServiceID]/
 * Returns the uploaded file's ID and shareable view link.
 */
async function uploadPhoto(localFilePath, fileName, serviceRecord) {
  if (!drive || !driveConfig.isDriveEnabled) {
    throw new Error('Google Drive integration is not enabled.');
  }

  if (!fs.existsSync(localFilePath)) {
    throw new Error(`Local file not found at path: ${localFilePath}`);
  }

  const year = new Date().getFullYear().toString();
  const customerId = String(serviceRecord.CustomerID || 0).padStart(5, '0');
  const serviceId = String(serviceRecord.ServiceID || 0).padStart(5, '0');

  // Resolve directory path on Drive step-by-step
  const yearFolderId = await getOrCreateFolder(year, driveConfig.rootFolderId);
  const customerFolderId = await getOrCreateFolder(customerId, yearFolderId);
  const serviceFolderId = await getOrCreateFolder(serviceId, customerFolderId);

  // Perform upload
  const fileMetadata = {
    name: fileName,
    parents: [serviceFolderId]
  };

  const media = {
    body: fs.createReadStream(localFilePath)
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id'
  });

  const fileId = file.data.id;
  return {
    driveFileId: fileId,
    driveURL: `https://drive.google.com/file/d/${fileId}/view`
  };
}

module.exports = {
  uploadPhoto
};
