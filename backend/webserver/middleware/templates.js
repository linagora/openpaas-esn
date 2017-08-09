/* eslint-disable no-process-env*/

const fs = require('fs-extra');
const path = require('path');

const VIEWS_ROOT_FOLDER = path.normalize(__dirname + '../../../../frontend/views/');
let CUSTOM_FOLDER = process.env.ESN_CUSTOM_TEMPLATES_FOLDER || 'custom';

CUSTOM_FOLDER += '/';

module.exports = {
  alterViewsFolder,
  alterTemplatePath
};

function alterTemplatePath(basePath, callback) {
  const pugTemplate = basePath.replace(/\.html$/, '') + '.pug';

  fs.exists(VIEWS_ROOT_FOLDER + CUSTOM_FOLDER + pugTemplate, function(exists) {
    if (exists) {
      callback(CUSTOM_FOLDER + pugTemplate);
    } else {
      callback(pugTemplate);
    }
  });
}

function alterViewsFolder(req, res, next) {
  alterTemplatePath(req.params[0], function(newTemplatePath) {
    req.params[0] = newTemplatePath;
    next();
  });
}
