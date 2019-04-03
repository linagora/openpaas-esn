/* eslint-disable no-process-env */
const Q = require('q');
const logger = require('../logger');
const userModule = require('../user');
const mongo = require('../db').mongo;
const pubsub = require('../pubsub').local;

const { isPlatformAdminDefined, addPlatformAdmin } = require('./index');

const platformAdminUsername = process.env.INIT_PLATFORMADMIN_USERNAME;
const platformAdminPassword = process.env.INIT_PLATFORMADMIN_PASSWORD;
const databaseReadyTopic = pubsub.topic('mongodb:connectionAvailable');

module.exports = () => {
  if (!platformAdminUsername) {
    logger.debug('PlatformAdmin.init - No username set, skipping');

    return Promise.resolve(false);
  }

  if (!platformAdminPassword) {
    logger.warn('PlatformAdmin.init - No password set');

    return Promise.resolve(false);
  }

  if (mongo.isConnected()) {
    return _init();
  }

  databaseReadyTopic.subscribe(_init);

  function _init() {
    logger.info('PlatformAdmin.init - Initializing platform admin');

    return isPlatformAdminDefined()
      .then(isDefined => (
        isDefined ? (() => {
          logger.info('PlatformAdmin.init - Platform admin is already defined, skipping');

          return false;
        })() : _createPlatformAdmin()))
      .catch(err => {
        logger.warn('PlatformAdmin.init - Can not define if a platform admin is already defined', err);
      });
  }

  function _createPlatformAdmin() {
    logger.info(_message('Provisioning platform admin from email...'));

    return _createUser()
      .then(user => {
        logger.info(_message(`User ${user._id} has been created`));

        return user;
      })
      .then(_addPlatformAdmin)
      .catch(err => logger.error(_message('Can not provision correctly platform admin'), err));
  }

  function _createUser() {
    logger.info(_message('Creating user...'));

    return Q.denodeify(userModule.provisionUser)({
      accounts: [{
        type: 'email',
        emails: [platformAdminUsername]
      }],
      password: platformAdminPassword
    }).catch(err => {
      logger.error(_message('Error while creating user'), err);

      throw err;
    });
  }

  function _addPlatformAdmin(user) {
    logger.info(_message(`Setting user with _id=${user._id} as platform admin...`));

    return addPlatformAdmin(user)
      .then(() => {
        logger.info(_message(`User with _id=${user._id} has been set as platform admin...`));
      })
      .catch(err => {
        logger.error(_message(`Can not set user ${user._id} as platform admin`), err);

        throw err;
      });
  }

  function _message(message) {
    return `PlatformAdmin.init - email=${platformAdminUsername}: ${message}`;
  }
};
