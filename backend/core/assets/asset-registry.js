class AssetRegistry {

  constructor() {
    this.assetTypes = {};
  }

  registerType(type, options = {}) {
    if (this.assetTypes[type]) {
      throw new Error('Asset type ' + type + ' is already registered');
    }
    this.assetTypes[type] = options;
  }

  all() {
    return this.assetTypes;
  }

  get(type) {
    return this.assetTypes[type];
  }
}

module.exports = new AssetRegistry();
