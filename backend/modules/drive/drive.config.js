const fs = require('fs');
const path = require('path');
const env = require('../../config/env');
const logger = require('../../utils/logger');

// Resolve the absolute key path relative to the backend root directory if set
let absoluteKeyPath = null;
if (env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
  absoluteKeyPath = path.isAbsolute(env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH)
    ? env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
    : path.join(__dirname, '..', '..', env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
}

const isDriveEnabled = !!(
  absoluteKeyPath &&
  fs.existsSync(absoluteKeyPath) &&
  env.GOOGLE_DRIVE_ROOT_FOLDER_ID
);

if (!isDriveEnabled) {
  logger.warn('Google Drive integration is disabled. Missing credentials file or GOOGLE_DRIVE_ROOT_FOLDER_ID in environment.');
} else {
  logger.info(`Google Drive integration is enabled. Root Folder ID: ${env.GOOGLE_DRIVE_ROOT_FOLDER_ID}`);
}

module.exports = {
  isDriveEnabled,
  keyPath: absoluteKeyPath,
  rootFolderId: env.GOOGLE_DRIVE_ROOT_FOLDER_ID
};
