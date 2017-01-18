'use strict';

const CONSTANTS = require('../constants');

module.exports = function(dependencies) {
  const amqpClientProvider = dependencies('amqpClientProvider');
  const logger = dependencies('logger');
  const userModule = dependencies('user');
  const caldavClient = require('../caldav-client')(dependencies);

  return {
    init
  };

  function init() {
    const amqpClientPromise = amqpClientProvider.getClient();

    return amqpClientPromise.then(client => client.subscribe(CONSTANTS.EVENT_MAIL_LISTENER.EXCHANGE, _processMessage))
      .catch(() => {
        logger.error('CAlEventMailListener : Cannot connect to MQ ' + CONSTANTS.EVENT_MAIL_LISTENER.EXCHANGE);
      });
  }

  function _processMessage(jsonMessage) {
    if (!_checkMandatoryFields(jsonMessage)) {
      logger.warn('CAlEventMailListener : Missing mandatory field => Event ignored');

      return;
    }

    userModule.findByEmail(jsonMessage.recipient, (err, user) => {
        if (err) {
          logger.error('CAlEventMailListener : Could not connect to UserModule => Event ignored');

          return;
        }

        if (user) {
          _handleMessage(user.id, jsonMessage);
        } else {
          logger.warn('CAlEventMailListener : Recipient user unknown in OpenPaas => Event ignored');
        }
      }
    );
  }

  function _checkMandatoryFields(jsonMessage = {}) {
    return jsonMessage.method && jsonMessage.sender && jsonMessage.recipient && jsonMessage.uid;
  }

  function _handleMessage(userId, jsonMessage) {
    caldavClient.iTipRequest(userId, jsonMessage);
  }
};
