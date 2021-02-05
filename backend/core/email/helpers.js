'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  getAttachments,
  hasAttachments,
  getTemplatesDir
};

/**
 * Check if a template has attachments.
 *
 * @param {string} templatesDir   A directory containing the templates
 * @param {string} templateName   A template's name to check for
 * @return {boolean}              Whether or not the template has attachments
 */
function hasAttachments(templatesDir, templateName) {
  try {
    return fs.statSync(path.join(templatesDir, templateName, 'attachments')).isDirectory();
  } catch (err) {
    return false;
  }
}

/**
 * Get the template attachments as an array suitable for nodemailer.
 *
 * @param {string} templatesDir   A directory containing the templates
 * @param {string} templateName   A template's name to check for
 * @param {function} filter       A function used to filter out files by filename
 * @return {array}                The list of attachments
 */
function getAttachments(templatesDir, templateName, filter) {
  const basepath = path.join(templatesDir, templateName, 'attachments');

  filter = filter || function() { return true; };

  const files = fs.readdirSync(basepath);

  return files.map(mapFile).filter(file => filter(file.filename));

  function mapFile(filePath) {
    return {
      filename: path.basename(filePath),
      path: path.join(basepath, filePath),
      cid: path.basename(filePath, path.extname(filePath)),
      contentDisposition: 'inline'
    };
  }
}

/**
 * Get the directory that contains a template.
 *
 * @param {string|object} template       An object containing information about a template or a template's name
 * @param {string} template.path         A path to the template (if template is an object)
 * @param {string} defaultTemplatesDir   A default directory for templates
 * @return {string}                      The directory that contains the template
 */
function getTemplatesDir(template, defaultTemplatesDir) {
  return template && template.path || defaultTemplatesDir;
}
