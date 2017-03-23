const assetRegistry = require('./asset-registry');
const ApplicationAsset = require('./application-asset');
const appAssets = {};

function app(appName) {
  if (!appAssets[appName]) {
    appAssets[appName] = new ApplicationAsset();
  }

  return appAssets[appName];
}

function registerType(assetType, options) {
  return assetRegistry.registerType(assetType, options);
}

function getAllTypes() {
  return assetRegistry.all();
}

function getType(assetType) {
  return assetRegistry.get(assetType);
}

// bundled types
registerType('js', {});
registerType('jsApp', {});
registerType('less', {sort: true});
registerType('angular', {dedup: true});

module.exports = {
  app,
  registerType,
  getAllTypes,
  getType
};
