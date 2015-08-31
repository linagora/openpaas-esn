'use strict';

var less = require('less');
var path = require('path');
var css = require('../../core').css;

function getFilesList(injections, appName) {
  var list = [];
  Object.keys(injections).forEach(function(k) {
    var moduleInjections = injections[k];
    if (!moduleInjections[appName] || !moduleInjections[appName].less) {
      return;
    }
    moduleInjections[appName].less.forEach(function(filePath) {
      list.push(filePath);
    });
  });
  return list;
}

function getCss(req, res, next) {
  if (!req.params || !req.params.app) {
    return res.send(404, { error: { status: 404, message: 'Not Found', details: 'No app defined'}});
  }
  var productionMode = process.env.NODE_ENV === 'production';
  var appName = req.params.app;
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
  less.render(lessContents, lessOptions)
  .then(function(output) {
    res.set('Content-Type', 'text/css');
    res.send(output.css);
  }, function(err) {
    return res.send(500, { error: { status: 500, message: 'Less compilation failed', details: err.stack}});
  });
}

module.exports.getCss = getCss;
