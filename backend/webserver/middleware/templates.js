'use strict';

var fs = require('fs-extra');
var path = require('path');

var VIEWS_ROOT_FOLDER = path.normalize(__dirname + '../../../../frontend/views/');
var CUSTOM_FOLDER = process.env.ESN_CUSTOM_TEMPLATES_FOLDER || 'custom';
CUSTOM_FOLDER += '/';

function alterTemplatePath(basePath, callback) {
  var jadeTemplate = basePath.replace(/\.html$/, '') + '.jade';
  fs.exists(VIEWS_ROOT_FOLDER + CUSTOM_FOLDER + jadeTemplate, function(exists) {
    if (exists) {
      callback(CUSTOM_FOLDER + jadeTemplate);
    } else {
      callback(jadeTemplate);
    }
  });
}

function alterViewsFolder(req, res, next) {
  alterTemplatePath(req.params[0], function(newTemplatePath) {
    req.params[0] = newTemplatePath;
    next();
  });
}


module.exports.alterViewsFolder = alterViewsFolder;
module.exports.alterTemplatePath = alterTemplatePath;
