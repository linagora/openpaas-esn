const AssetCollection = require('./asset-collection');

class ApplicationAsset {

  constructor() {
    this.assets = {};
  }

  type(assetType) {
    if (!this.assets[assetType]) {
      this.assets[assetType] = new AssetCollection(assetType);
    }

    return this.assets[assetType];
  }

}

module.exports = ApplicationAsset;
