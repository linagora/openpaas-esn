'use strict';

var fs = require('fs');
var path = require('path');

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
function getAttachments(templatesDir, template, filter, done) {
  var basepath = path.join(templatesDir, template, 'attachments');

  filter = filter || function() { return true; };

  fs.readdir(basepath, function(err, files) {
    if (err) {
      return done(err);
    }

    var attachments = files.map(function(filePath) {
      var basename = path.basename(filePath);

      return {
        filename: basename,
        path: path.join(basepath, filePath),
        cid: path.basename(filePath, path.extname(filePath)),
        contentDisposition: 'inline'
      };
    }).filter(function(file) {
      return filter(file.filename);
    });

    done(null, attachments);
  });

}

module.exports = {
  hasAttachments: hasAttachments,
  getAttachments: getAttachments
};
