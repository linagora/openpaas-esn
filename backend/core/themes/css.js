/* eslint-disable no-process-env */
const less = require('less');
const path = require('path');
const componentsPath = path.resolve(__dirname, '../../../frontend/components/');
const lessMainFile = path.resolve(__dirname, '../../../frontend/css/styles.less');

const logger = require('../logger');
const MemoryStore = require('../../helpers/memory-store');
const assetRegistry = require('../../core').assets;
const { getTheme } = require('./index');

// key is domain ID, values are hash of { appName: less result }
const appCache = {};
const DEFAULT_KEY = 'default';

module.exports = {
  generate
};

function generate(appName, domainId) {
  logger.info(`core.themes.css#generate (app ${appName}) - Generate`);

  if (!shouldCache()) {
    return renderLess(appName, domainId);
  }

  const key = domainId || DEFAULT_KEY;

  if (!appCache[key] || !appCache[key][appName]) {
    if (!appCache[key]) {
      appCache[key] = {};
    }

    return renderLess(appName, domainId).then(result => {
      appCache[key][appName] = new MemoryStore(result);

      return appCache[key][appName].get();
    });
  }

  return Promise.resolve(appCache[key][appName].get());
}

function renderLess(appName, domainId) {
  return getLessContents(appName, domainId).then(lessContents => {
    const lessOptions = getLessOptions();

    logger.debug(`core.themes.css#renderLess (app ${appName}) - Rendering less ${lessContents} with options ${JSON.stringify(lessOptions)}`);

    return less.render(lessContents, lessOptions);
  });
}

function getLessContents(appName, domainId) {
  const injections = assetRegistry.app(appName).type('less').allNames();
  let lessContents = `@import '${lessMainFile}';\n`;

  return getColors(domainId).then(colors => {
    if (colors && colors.length) {
      lessContents += colors;
    }

    injections.forEach(filePath => (lessContents += `@import '${filePath}';\n`));

    return lessContents;
  });
}

function getColors(domainId) {
  if (!domainId) {
    return Promise.resolve();
  }

  return getTheme(domainId)
    .then(theme => {
      if (!theme || !theme.colors) {
        return;
      }

      return theme.colors.map(color => (`@${color.key}: ${color.value};`)).join('\n');
    })
    .catch(err => {
      logger.warn('Error while getting domain theme', err);
    });
}

function getLessOptions() {
  const lessOptions = {
    filename: 'styles.less',
    globalVars: { components: `"${componentsPath}"` }
  };

  if (isProductionMode()) {
    lessOptions.compress = true;
  } else {
    lessOptions.sourceMap = { sourceMapFileInline: true };
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
