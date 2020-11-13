'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  getAttachments,
  hasAttachments
};

/**
 * Check if template has attachments.
 *
 * @param {string} template       The name of the template to check for.
 * @return {boolean}              True, if the template has attachments.
 */
function hasAttachments(templatesDir, template) {
  try {
    return fs.statSync(path.join(templatesDir, template, 'attachments')).isDirectory();
  } catch (err) {
    return false;
  }
}

/**
 * Get the template attachments as an array suitable for nodemailer.
 *
 * @param {string} template       The name of the template to check for.
 * @param {function} filter       The function used to filter out files by filename.
 * @param {function} done         a callback function called with (err, data)
 * @return {*}
 */
function getAttachments(templatesDir, template, filter, callback) {
  const basepath = path.join(templatesDir, template, 'attachments');

  filter = filter || function() { return true; };

  fs.readdir(basepath, (err, files) => {
    if (err) {
      return callback(err);
    }

    callback(null, files.map(mapFile).filter(file => filter(file.filename)));
  });

  function mapFile(filePath) {
    return {
      filename: path.basename(filePath),
      path: path.join(basepath, filePath),
      cid: path.basename(filePath, path.extname(filePath)),
      contentDisposition: 'inline'
    };
  }
}
