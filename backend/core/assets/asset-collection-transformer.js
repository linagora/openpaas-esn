const _ = require('lodash');
const Asset = require('./asset');
const join = require('path').join;

class AssetCollectionTransformer {
  constructor(baseAssetCollection, shadowAssetCollection, appName, wsBaseUri) {
    this.baseAssetCollection = baseAssetCollection;
    this.shadowAssetCollection = shadowAssetCollection;
    this.appName = appName;
    this.wsBaseUri = wsBaseUri;
  }

  // this is the method that this transformer overrides
  all() {
    return this.getAssetsForInjection();
  }

  getKnownNamespaces() {
    return {
      base: this.baseAssetCollection.namespaces(),
      shadow: this.shadowAssetCollection.namespaces()
    };
  }

  getBaseAssets(namespaces) {
    if (namespaces === true) {
      const knownNamespaces = this.getKnownNamespaces();

      namespaces = _.difference(knownNamespaces.base, knownNamespaces.shadow);
    }

    return this.baseAssetCollection.all(namespaces);
  }

  getAssetsForInjection() {
    if (process.env.NODE_ENV !== 'production') {
      return this.baseAssetCollection.all();
    }

    const generatedJsBaseUri = join(this.wsBaseUri, this.appName);
    let allAssets = this.getBaseAssets(true);
    const fullPathAssets = this.shadowAssetCollection.namespaces()
      .map(fullPathNamespace => new Asset(fullPathNamespace, generatedJsBaseUri));

    if (fullPathAssets.length) {
      allAssets = allAssets.concat(fullPathAssets);
    }

    return allAssets;
  }
}

module.exports = AssetCollectionTransformer;
