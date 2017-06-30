'use strict';

const esnConfig = require('../../core/esn-config');
const logger = require('../../core/logger');

module.exports = {
  getConfigurations,
  updateConfigurations
};

function getConfigurations(req, res) {
  const domainId = req.query.domain_id || null;
  const userId = req.query.user_id || null;
  const configsToGet = req.body;
  let getConfigurations;

  if (req.query.inspect) {
    getConfigurations = esnConfig.configurations.inspectConfigurations;
  } else {
    getConfigurations = esnConfig.configurations.getConfigurations;
  }

  return getConfigurations(configsToGet, domainId, userId)
    .then(
      modules => res.status(200).json(modules),
      err => {
        logger.error('Error while getting configurations:', err);

        return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
      }
    );
}

function updateConfigurations(req, res) {
  const domainId = req.query.domain_id || null;
  const userId = req.query.user_id || null;
  const modules = req.body;

  return esnConfig.configurations.updateConfigurations(modules, domainId, userId)
    .then(
      () => res.status(204).end(),
      err => {
        logger.error('Error while updating configuration:', err);

        return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
      }
    );
}
