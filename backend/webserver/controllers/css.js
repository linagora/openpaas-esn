'use strict';

var less = require('less');
var path = require('path');
var logger = require('../../core/logger');
var MemoryStore = require('../../helpers/memory-store');

const assetRegistry = require('../../core').assets;

const componentsPath = path.resolve(__dirname, '../../../frontend/components/');
const lessMainFile = path.resolve(__dirname, '../../../frontend/css/styles.less');
const appCache = {};

function getCss(req, res) {
  if (!req.params || !req.params.app) {
    return res.status(404).json({ error: { status: 404, message: 'Not Found', details: 'No app defined'}});
  }
  var appName = req.params.app;

  lessToCss(appName)
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

function lessToCss(appName) {
  if (!shouldCache()) {
    return renderLess(appName);
  }

  if (!appCache[appName]) {
    appCache[appName] = new MemoryStore(renderLess(appName));
  }

  return appCache[appName].get();
}

function renderLess(appName) {
  const lessOptions = getLessOptions();
  const lessContents = getLessContents(appName);

  return less.render(lessContents, lessOptions);
}

function getLessContents(appName) {
  let lessContents = '@import \'' + lessMainFile + '\';\n';
  const injections = assetRegistry.app(appName).type('less').allNames();

  injections.forEach(function(filePath) {
    lessContents += '@import \'' + filePath + '\';\n';
  });

  return lessContents;
}

function getLessOptions() {
  const lessOptions = {
    filename: 'styles.less',
    globalVars: {components: '"' + componentsPath + '"'}
  };

  if (isProductionMode()) {
    lessOptions.compress = true;
  } else {
    lessOptions.sourceMap = {sourceMapFileInline: true};
  }

  return lessOptions;
}

function shouldCache() {
  if (process.env.ESN_CSS_CACHE_OFF === 'true') {
    return false;
  } else if (process.env.ESN_CSS_CACHE_ON === 'true') {
    return true;
  }

  return isProductionMode();
}

function isProductionMode() {
  return process.env.NODE_ENV === 'production';
}

module.exports.getCss = getCss;
