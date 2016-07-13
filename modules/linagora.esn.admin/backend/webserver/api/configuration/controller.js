'use strict';

var domainConfig;

function getConfigurations(req, res) {
  var configNames = req.body.configNames;
  var domainId = req.domain._id;

  domainConfig.get(domainId, configNames)
    .then(function(configs) {
      return res.status(200).json(configs);
    }, function(err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
    });
}

function updateConfigurations(req, res) {
  var configs = req.body.configs || [];
  var domainId = req.domain._id;

  domainConfig.set(domainId, configs)
    .then(function(data) {
      return res.status(200).json(data);
    }, function(err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
    });
}

module.exports = function(dependencies) {
  domainConfig = dependencies('domain-config');

  return {
    getConfigurations: getConfigurations,
    updateConfigurations: updateConfigurations
  };
};
