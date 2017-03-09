const assetRegistry = require('./asset-registry');
const Asset = require('./asset');
const logger = require('../').logger;

function _ensureAssets(assets, namespace) {
  return assets.map(asset => Asset.fromObject(asset, namespace))
    .filter(asset => {
      if (asset.name && asset.namespace) {
        return true;
      }
      logger.debug('Asset ' + asset + ' has been rejected: has either no name or no namespace');

      return false;
    });

}

function _dedup(new_assets, assets) {
  const uniq_assets = [];

  new_assets.forEach(asset => {
    if (!assets.filter(base_asset => (asset.equals(base_asset))).length &&
        !uniq_assets.filter(base_asset => (asset.equals(base_asset))).length) {
      uniq_assets.push(asset);
    }
  });

  return uniq_assets;
}

function _sortByPriority(a, b) {
  return b.priority - a.priority;
}

class AssetCollection {

  constructor(type) {
    const assetDefinition = assetRegistry.get(type);

    if (!assetDefinition) {
      throw new Error('undefined asset type ' + type);
    }
    this.options = assetDefinition;
    this.assets = [];
  }

  add(assets, namespace) {
    const a_assets = Array.isArray(assets) ? assets : [assets];
    const clean_assets = _ensureAssets(a_assets, namespace);
    const final_new_assets = this.options.dedup ? _dedup(clean_assets, this.assets) : clean_assets;

    if (!final_new_assets.length) {
      return;
    }

    this.assets = this.assets.concat(final_new_assets);
    if (this.options.sort) {
      this.assets.sort(_sortByPriority);
    }
  }

  all() {
    return this.assets.slice();
  }

  allNames() {
    return this.assets.map(asset => (asset.name));
  }
}

module.exports = AssetCollection;
