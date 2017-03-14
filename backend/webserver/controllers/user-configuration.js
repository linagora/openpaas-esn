'use strict';

const esnConfig = require('../../core/esn-config');
const logger = require('../../core/logger');

module.exports = {
  getConfigurations,
  updateConfigurations
};

function getConfigurations(req, res) {
  const modules = req.body;
  const user = req.user;

  return esnConfig.configurations.getConfigurations(modules, user.preferredDomainId, user._id)
    .then(
      modules => res.status(200).json(modules),
      err => {
        logger.error('Error while getting configurations:', err);

        return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
      }
    );
}

function updateConfigurations(req, res) {
  const modules = req.body;
  const user = req.user;

  return esnConfig.configurations.updateConfigurations(modules, user.preferredDomainId, user._id)
    .then(
      () => res.status(204).end(),
      err => {
        logger.error('Error while updating configuration:', err);

        return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
      }
    );
}
