const ProvisionProvider = require('./provider');
const ProvisionService = require('./service');
const service = new ProvisionService();

module.exports = {
  ProvisionProvider,
  service
};
