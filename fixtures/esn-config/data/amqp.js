'use strict';

module.exports = function() {
  var host = process.env.AMQP_HOST || 'amqp';
  var port = process.env.AMQP_PORT || '5672';

  return {
    url: 'amqp://' + host + ':' + port
  };
};
