'use strict';

var less = require('less');
var path = require('path');
var css = require('../../core').css;
var logger = require('../../core/logger');

function getFilesList(injections, appName) {
  var list = [];

  Object.keys(injections).forEach(function(k) {
    var moduleInjections = injections[k];

    if (!moduleInjections[appName] || !moduleInjections[appName].less) {
      return;
    }
    moduleInjections[appName].less.forEach(function(filePath) {
      list.push(filePath.filename);
    });
  });

  return list;
}

function getCss(req, res) {
  if (!req.params || !req.params.app) {
    return res.status(404).json({ error: { status: 404, message: 'Not Found', details: 'No app defined'}});
  }
  var productionMode = process.env.NODE_ENV === 'production';
  var appName = req.params.app;
  var componentsPath = path.resolve(__dirname, '../../../frontend/components/');
  var lessMainFile = path.resolve(__dirname, '../../../frontend/css/styles.less');
  var lessOptions = {
    filename: 'styles.less'
  };

  if (productionMode) {
    lessOptions.compress = true;
  } else {
    lessOptions.sourceMap = {sourceMapFileInline: true};
  }
  var lessContents = '@import \'' + lessMainFile + '\';\n';
  var injections = css.getInjections();

  getFilesList(injections, appName).forEach(function(filePath) {
    lessContents += '@import \'' + filePath + '\';\n';
  });
  lessOptions.globalVars = {components: '"' + componentsPath + '"'};
  less.render(lessContents, lessOptions)
  .then(function(output) {
    res.set('Content-Type', 'text/css');
    res.send(output.css);
  }, function(err) {
    logger.error('Less compilation failed:', err);

    return res.status(500).json({
      error: {
        status: 500,
        message: 'Server Error',
        details: 'Less compilation failed: ' + err.message
      }
    });
  });
}

module.exports.getCss = getCss;
