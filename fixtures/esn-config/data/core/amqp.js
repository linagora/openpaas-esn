'use strict';

const amqpUtils = require('../../../../backend/core/amqp/utils');

function _getConnectionUrl() {
  process.env.AMQP_HOST = process.env.AMQP_HOST || 'amqp';

  return amqpUtils.buildUrlFromEnvOrDefaults();
}

module.exports = function() {
  return {
    url: _getConnectionUrl()
  };
};
