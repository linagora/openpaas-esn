const ProvisionProvider = require('./provider');

class ProvisionService {
  constructor() {
    this.providers = new Map();
  }

  addProvider(provider) {
    if (!provider || !(provider instanceof ProvisionProvider)) {
      throw new Error('Wrong definition of a provider', provider);
    }

    if (this.providers.get(provider.name)) {
      throw new Error(`A provider with the name of ${provider.name} already exists`);
    }

    this.providers.set(provider.name, provider);
  }
}

module.exports = ProvisionService;
