class Asset {

  constructor(name, namespace, priority = 0) {
    this.name = name;
    this.namespace = namespace;
    this.priority = priority;
  }

  equals(asset) {
    return this.name === asset.name &&
      this.namespace === asset.namespace &&
      this.priority === asset.priority;
  }

  static fromObject(asset, namespace) {
    return new Asset(asset.name || asset, asset.namespace || namespace, asset.priority || 0);
  }
}

module.exports = Asset;
