'use strict';

var fs = require('fs-extra');
var path = require('path');

var VIEWS_ROOT_FOLDER = path.normalize(__dirname + '../../../../frontend/views/');

function alterViewsFolder(req, res, next) {
  var CUSTOM_FOLDER = process.env.ESN_CUSTOM_TEMPLATES_FOLDER || 'custom';
  CUSTOM_FOLDER += '/';
  var jadeTemplate;
  if (req.params[0].indexOf('.html') > 0) {
    jadeTemplate = req.params[0].replace(/\.html$/, '.jade');
  } else {
    jadeTemplate = req.params[0] + '.jade';
  }
  fs.exists(VIEWS_ROOT_FOLDER + CUSTOM_FOLDER + jadeTemplate, function(exists) {
    if (exists) {
      req.params[0] = CUSTOM_FOLDER + req.params[0];
    }
    return next();
  });
}

module.exports.alterViewsFolder = alterViewsFolder;
