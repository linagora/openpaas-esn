class ProvisionProvider {
  constructor(name, provision, verify) {
    this.name = name;
    this.provision = provision;
    this.verify = verify;
  }
}

module.exports = ProvisionProvider;
